"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  currentNotificationState,
  hasVapidKey,
  isNotificationSupported,
  registerFcmToken,
  requestNotificationPermission,
  subscribeForegroundMessages,
  unregisterFcmToken,
} from "@/lib/firebase-messaging";
import { auth } from "@/lib/firebase";

export type NotificationState =
  | "unsupported"
  | "not-configured"
  | "default"
  | "granted"
  | "denied";

/**
 * Single source of truth for the push-notification lifecycle.
 *
 * - Tracks the browser's permission + FCM token status.
 * - Exposes `enable()` and `disable()` methods with toast feedback.
 * - Subscribes to foreground FCM messages and forwards them as toasts,
 *   because Firebase does not surface them as system notifications while
 *   the tab is focused.
 */
export function useNotifications() {
  const [state, setState] = useState<NotificationState>("default");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep local state in sync with the browser + Firebase status.
  useEffect(() => {
    setState(currentNotificationState());
  }, []);

  // Watch for auth changes — signing out should wipe the token from state.
  useEffect(() => {
    if (!auth) return;
    return auth.onAuthStateChanged(() => {
      setState(currentNotificationState());
      if (!auth?.currentUser) setToken(null);
    });
  }, []);

  // Foreground push handler — shows an in-app toast when a message arrives
  // while the user is on this tab.
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      if (!isNotificationSupported()) return;
      unsub = await subscribeForegroundMessages((payload) => {
        const title = payload?.notification?.title || "PassionVerse reminder";
        const body = payload?.notification?.body || "";
        toast(title, { description: body });
      });
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    try {
      const perm = await requestNotificationPermission();
      if (!perm.ok) {
        if (perm.reason === "denied") {
          toast.error("Notifications blocked", {
            description:
              perm.message ??
              "Allow notifications for this site in your browser settings, then try again.",
          });
        } else if (perm.reason === "not-configured") {
          toast.error("Sign in required", {
            description:
              "Sign in with Google, then click Enable notifications again.",
          });
        } else {
          toast.error("Could not enable notifications", {
            description: perm.message ?? "Please try again.",
          });
        }
        setState(currentNotificationState());
        return false;
      }

      // Permission granted — register the FCM token.
      const reg = await registerFcmToken();
      setState("granted");

      if (reg.ok && reg.token) {
        setToken(reg.token);
        toast.success("Notifications on", {
          description:
            "You will receive push reminders when a scheduled session is due.",
        });
        return true;
      }

      // Permission was granted but token registration failed — usually
      // because the VAPID key isn't set. In-tab reminders still work; we
      // tell the user honestly what happened.
      if (!reg.ok) {
        if (reg.reason === "no-vapid-key") {
          toast.warning("In-tab reminders enabled", {
            description:
              "Background push needs NEXT_PUBLIC_FIREBASE_VAPID_KEY. Reminders will still fire while any PassionVerse tab is open.",
          });
        } else {
          toast.warning("Partial setup", {
            description:
              reg.message ??
              "Notifications are allowed, but background push registration did not complete.",
          });
        }
      }
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await unregisterFcmToken();
      setToken(null);
      toast("Notifications turned off for background push", {
        description:
          "You can re-enable them any time from Settings or the Timetable tab.",
      });
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    state,
    token,
    busy,
    hasVapidKey,
    isSupported: isNotificationSupported(),
    enable,
    disable,
  };
}
