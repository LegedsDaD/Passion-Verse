"use client";

import { useCallback, useEffect, useState } from "react";
import { auth, dbFirestore, isFirebaseConfigured } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export interface UserApiSettings {
  geminiApiKey: string;
  elevenLabsApiKey: string;
}

const EMPTY_SETTINGS: UserApiSettings = { geminiApiKey: "", elevenLabsApiKey: "" };
const LS_KEY = "passionverse.userApiSettings.v1";

function readLocal(): UserApiSettings {
  if (typeof window === "undefined") return EMPTY_SETTINGS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? { ...EMPTY_SETTINGS, ...JSON.parse(raw) } : EMPTY_SETTINGS;
  } catch {
    return EMPTY_SETTINGS;
  }
}

function writeLocal(settings: UserApiSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota errors — settings are best-effort in local mode.
  }
}

/**
 * Lets a signed-in user optionally store their own Gemini and ElevenLabs API
 * keys (Settings tab). The app always ships with a built-in Gemini key on
 * the server; a personal key here simply overrides it for that user's
 * requests. Stored in Firestore under `userSettings/{uid}` (readable only by
 * that user, see firestore.rules) and mirrored to localStorage as a fallback
 * when Firebase isn't configured for local development.
 */
export function useUserSettings() {
  const [uid, setUid] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserApiSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth) {
      setUid(null);
      return;
    }
    return auth.onAuthStateChanged((u) => setUid(u?.uid ?? null));
  }, []);

  const useFirestore = isFirebaseConfigured && Boolean(dbFirestore) && Boolean(uid);

  useEffect(() => {
    setLoading(true);

    if (useFirestore && dbFirestore && uid) {
      const ref = doc(dbFirestore, "userSettings", uid);
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          const data = snap.data() as Partial<UserApiSettings> | undefined;
          setSettings({
            geminiApiKey: data?.geminiApiKey ?? "",
            elevenLabsApiKey: data?.elevenLabsApiKey ?? "",
          });
          setLoading(false);
        },
        () => {
          setSettings(readLocal());
          setLoading(false);
        }
      );
      return unsubscribe;
    }

    setSettings(readLocal());
    setLoading(false);
  }, [useFirestore, uid]);

  const saveSettings = useCallback(
    async (next: UserApiSettings) => {
      setSaving(true);
      try {
        if (useFirestore && dbFirestore && uid) {
          await setDoc(
            doc(dbFirestore, "userSettings", uid),
            { ...next, updatedAt: serverTimestamp() },
            { merge: true }
          );
        } else {
          writeLocal(next);
          setSettings(next);
        }
      } finally {
        setSaving(false);
      }
    },
    [useFirestore, uid]
  );

  return {
    settings,
    loading,
    saving,
    saveSettings,
    usingPersonalGeminiKey: Boolean(settings.geminiApiKey.trim()),
  };
}
