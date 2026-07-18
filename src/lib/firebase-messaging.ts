/**
 * Client-only helpers for Firebase Cloud Messaging (FCM).
 *
 * FCM only runs in the browser; we never touch it on the server. The flow
 * is:
 *   1. The signed-in user clicks "Enable notifications" in Settings.
 *   2. We request the Notification permission from the browser.
 *   3. We call `getToken(messaging, { vapidKey })` — the VAPID key comes
 *      from the Firebase console's "Cloud Messaging" tab (Web configuration).
 *   4. We store the token in `userTokens/{uid}` so a future Cloud Function
 *      (or this app's own local scheduler) can target this user.
 *   5. A `public/firebase-messaging-sw.js` service worker receives
 *      background messages and renders them as system notifications.
 *
 * If Firebase isn't configured, every helper degrades to a no-op and
 * reports `{ ok: false, reason: "not-configured" }` so callers can show a
 * friendly hint.
 */
"use client";

import { auth, dbFirestore, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

// The Firebase console exposes this under Project Settings → Cloud
// Messaging → Web configuration → "Web Push certificates". Replace with
// your own once you deploy.
const VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  "REPLACE_WITH_YOUR_WEB_PUSH_CERTIFICATE_FROM_FIREBASE_CONSOLE";

export type NotificationSupport =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "unsupported" | "denied" | "error"; message?: string };

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  return true;
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (!isFirebaseConfigured || !dbFirestore || !auth?.currentUser) {
    return { ok: false, reason: "not-configured", message: "Firebase or sign-in is not ready yet." };
  }
  if (!isNotificationSupported()) {
    return { ok: false, reason: "unsupported", message: "This browser does not support push notifications." };
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "denied", message: "Notification permission was not granted." };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Permission request failed.",
    };
  }
}

export async function registerFcmToken(): Promise<NotificationSupport & { token?: string }> {
  if (!isFirebaseConfigured || !dbFirestore || !auth?.currentUser) {
    return { ok: false, reason: "not-configured" };
  }
  if (!isNotificationSupported()) {
    return { ok: false, reason: "unsupported" };
  }
  try {
    const { getMessaging, getToken } = await import("firebase/messaging");
    const { app } = await import("@/lib/firebase");
    if (!app) return { ok: false, reason: "not-configured" };
    const messaging = getMessaging(app);

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) {
      return { ok: false, reason: "error", message: "FCM did not return a token." };
    }

    await setDoc(
      doc(dbFirestore, "userTokens", auth.currentUser.uid),
      {
        fcmToken: token,
        updatedAt: serverTimestamp(),
        userAgent: navigator.userAgent,
      },
      { merge: true }
    );
    return { ok: true, token };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "FCM registration failed.",
    };
  }
}

export async function unregisterFcmToken(): Promise<void> {
  if (!isFirebaseConfigured || !dbFirestore || !auth?.currentUser) return;
  try {
    await deleteDoc(doc(dbFirestore, "userTokens", auth.currentUser.uid));
  } catch {
    /* best effort */
  }
}

/**
 * Schedule local, in-tab notifications derived from the timetable rows.
 * These fire while the tab is open (using setTimeout) — useful for demos
 * and for users without a deployed Cloud Function. For fully background
 * push, deploy a Cloud Function that reads `userTokens/{uid}` and sends
 * via the Admin SDK (see FIREBASE_NOTIFICATIONS.md).
 */
export function scheduleLocalTimetableNotifications(
  rows: Array<{ notifyAt: string | null; title: string; description: string }>
): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const now = Date.now();
  for (const row of rows) {
    if (!row.notifyAt) continue;
    const at = new Date(row.notifyAt).getTime();
    if (!Number.isFinite(at)) continue;
    const delay = at - now;
    // Only schedule within the next 7 days; older rows are treated as
    // already passed and skipped to avoid firing immediately on load.
    if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) continue;
    const t = setTimeout(() => {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(row.title, {
            body: row.description,
            icon: "/passionverse-logo.png",
          });
        } catch {
          /* ignore */
        }
      }
    }, delay);
    timers.push(t);
  }
  return () => timers.forEach(clearTimeout);
}
