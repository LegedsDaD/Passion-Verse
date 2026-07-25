/**
 * Client-only helpers for Firebase Cloud Messaging (FCM).
 *
 * The full flow:
 *   1. The signed-in user clicks "Enable notifications" (Settings or
 *      Timetable tab).
 *   2. `requestNotificationPermission()` asks the browser for permission.
 *   3. `registerFcmToken()` registers the Firebase service worker,
 *      calls `getToken(messaging, { vapidKey })`, and stores the token
 *      at `userTokens/{uid}` in Firestore so a scheduled Cloud Function
 *      can target the user later.
 *   4. `subscribeForegroundMessages()` shows an in-app toast when a push
 *      arrives while the tab is focused (FCM does not surface those as
 *      system notifications automatically).
 *   5. `scheduleLocalTimetableNotifications()` provides zero-server
 *      reminders that fire from an open tab; they work even without a
 *      deployed Cloud Function.
 *
 * If Firebase isn't configured, every helper degrades to a no-op and
 * reports `{ ok: false, reason: "not-configured" }` so callers can show
 * a friendly hint.
 */
"use client";

import { auth, dbFirestore, isFirebaseConfigured, app as fbApp } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const RAW_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  "REPLACE_WITH_YOUR_WEB_PUSH_CERTIFICATE_FROM_FIREBASE_CONSOLE";

/** True if a real (non-placeholder) VAPID key is present in the env. */
export const hasVapidKey =
  Boolean(RAW_VAPID_KEY) && !RAW_VAPID_KEY.startsWith("REPLACE_WITH_");

export type NotificationSupport =
  | { ok: true }
  | {
      ok: false;
      reason: "not-configured" | "unsupported" | "denied" | "no-vapid-key" | "error";
      message?: string;
    };

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;
  return true;
}

/**
 * The current best-guess of what state the FCM permission is in for the
 * signed-in user + this browser. Cheap enough to call every render.
 */
export function currentNotificationState():
  | "unsupported"
  | "not-configured"
  | "default"
  | "granted"
  | "denied" {
  if (!isNotificationSupported()) return "unsupported";
  if (!isFirebaseConfigured) return "not-configured";
  const perm = Notification.permission;
  if (perm === "granted") return "granted";
  if (perm === "denied") return "denied";
  return "default";
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (!isFirebaseConfigured || !dbFirestore || !auth?.currentUser) {
    return {
      ok: false,
      reason: "not-configured",
      message: "Sign in first, then enable notifications.",
    };
  }
  if (!isNotificationSupported()) {
    return {
      ok: false,
      reason: "unsupported",
      message: "This browser does not support push notifications.",
    };
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        ok: false,
        reason: "denied",
        message:
          "Notifications were not allowed. Enable them in your browser's site settings and try again.",
      };
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

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // Use an existing registration if we already have one — re-registering
    // is safe but wasteful.
    const existing = await navigator.serviceWorker.getRegistration(
      "/firebase-messaging-sw.js"
    );
    if (existing) return existing;
    return await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
  } catch (err) {
    console.warn("SW registration failed:", err);
    return null;
  }
}

export async function registerFcmToken(): Promise<NotificationSupport & { token?: string }> {
  if (!isFirebaseConfigured || !dbFirestore || !auth?.currentUser) {
    return {
      ok: false,
      reason: "not-configured",
      message: "Sign in first, then enable notifications.",
    };
  }
  if (!isNotificationSupported()) {
    return { ok: false, reason: "unsupported" };
  }
  if (!hasVapidKey) {
    return {
      ok: false,
      reason: "no-vapid-key",
      message:
        "NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. Local in-tab reminders will still work; see FIREBASE_NOTIFICATIONS.md for background push.",
    };
  }

  try {
    const { getMessaging, getToken, isSupported } = await import(
      "firebase/messaging"
    );
    if (!(await isSupported())) {
      return {
        ok: false,
        reason: "unsupported",
        message: "This browser does not support Firebase Cloud Messaging.",
      };
    }
    if (!fbApp) return { ok: false, reason: "not-configured" };

    const registration = await registerServiceWorker();
    const messaging = getMessaging(fbApp);
    const token = await getToken(messaging, {
      vapidKey: RAW_VAPID_KEY,
      serviceWorkerRegistration: registration ?? undefined,
    });

    if (!token) {
      return {
        ok: false,
        reason: "error",
        message:
          "FCM did not return a token. Make sure you have granted notification permission and try again.",
      };
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
    console.error("FCM registration failed:", err);
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
 * Subscribe to foreground FCM messages (when the tab is focused). The
 * caller receives every payload; typical use is to show an in-app toast.
 * Returns an unsubscribe function.
 */
export async function subscribeForegroundMessages(
  handler: (payload: {
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  }) => void
): Promise<() => void> {
  if (!isFirebaseConfigured || !fbApp || !isNotificationSupported()) {
    return () => {};
  }
  try {
    const { getMessaging, onMessage, isSupported } = await import(
      "firebase/messaging"
    );
    if (!(await isSupported())) return () => {};
    const messaging = getMessaging(fbApp);
    return onMessage(messaging, handler);
  } catch {
    return () => {};
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
