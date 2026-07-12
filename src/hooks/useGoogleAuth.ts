"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

/**
 * Centralized Google sign-in.
 *
 * A very common symptom people describe as "the sign-in window opens and
 * immediately closes" is `signInWithPopup` failing silently because the
 * popup's window handle can't report back to the opener (browser popup
 * blockers, Safari ITP, or a strict Cross-Origin-Opener-Policy). Rather than
 * surfacing a cryptic error, we transparently retry with
 * `signInWithRedirect`, which does not depend on a popup window at all.
 */
export function useGoogleAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectCheckedRef = useRef(false);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }

    if (!redirectCheckedRef.current) {
      redirectCheckedRef.current = true;
      getRedirectResult(auth).catch((err) => {
        console.warn("Redirect sign-in did not complete:", err);
      });
    }

    const unsubscribe = auth.onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<"success" | "redirecting" | "error"> => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError("Firebase is not configured for this deployment yet.");
      return "error";
    }

    setSigningIn(true);
    setError(null);

    try {
      await signInWithPopup(auth, googleProvider);
      return "success";
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";

      // These codes are the classic fingerprint of a popup that opens and
      // then immediately appears to close: it was blocked, the browser
      // can't report its state back to us, or a previous request is stuck.
      const shouldFallbackToRedirect = [
        "auth/popup-blocked",
        "auth/cancelled-popup-request",
        "auth/popup-closed-by-user",
        "auth/web-storage-unsupported",
        "auth/operation-not-supported-in-this-environment",
        "auth/internal-error",
      ].includes(code);

      if (shouldFallbackToRedirect) {
        try {
          await signInWithRedirect(auth, googleProvider);
          // The browser navigates away here; there is nothing left to do.
          return "redirecting";
        } catch (redirectErr) {
          setError(
            redirectErr instanceof Error
              ? redirectErr.message
              : "Sign-in failed. Please try again."
          );
          return "error";
        }
      }

      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      return "error";
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signInWithRedirectDirect = useCallback(async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError("Firebase is not configured for this deployment yet.");
      return;
    }
    setError(null);
    await signInWithRedirect(auth, googleProvider);
  }, []);

  const signOutUser = useCallback(async () => {
    if (auth) await signOut(auth);
  }, []);

  return {
    user,
    authReady,
    signingIn,
    error,
    clearError: () => setError(null),
    signInWithGoogle,
    signInWithRedirectDirect,
    signOutUser,
  };
}
