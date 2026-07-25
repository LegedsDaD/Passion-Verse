"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { auth, dbFirestore, isFirebaseConfigured } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import type { PresetRoadmap } from "@/lib/seed-data";

/**
 * Reads & writes roadmaps to Firebase Firestore when the client Firebase
 * configuration is present, and to localStorage otherwise.
 *
 * Firestore layout: `roadmaps/{id}` where each document carries userId,
 * source ("mine" | "example"), and the full roadmap payload.
 */

const LS_KEY = "passionverse.myRoadmaps.v1";
const LS_USER_KEY = "passionverse.localUserId.v1";

function readLocalStorage(): PresetRoadmap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PresetRoadmap[]) : [];
  } catch {
    return [];
  }
}

function writeLocalStorage(list: PresetRoadmap[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
}

function localUserId(): string {
  if (typeof window === "undefined") return "anon";
  let id = window.localStorage.getItem(LS_USER_KEY);
  if (!id) {
    id = `local_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    window.localStorage.setItem(LS_USER_KEY, id);
  }
  return id;
}

/**
 * Deeply strip `undefined` and non-serialisable values (functions, symbols,
 * `Date` objects that we didn't already convert). Firestore accepts what
 * JSON.stringify accepts, so a round-trip through JSON is the simplest
 * belt-and-suspenders that also guarantees no cycles slip in.
 */
function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null));
}

export type RoadmapSource = "mine" | "example";

export function useRoadmaps() {
  const [myRoadmaps, setMyRoadmaps] = useState<PresetRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const userId = firebaseUid || localUserId();
  const useFirestore = isFirebaseConfigured && Boolean(dbFirestore) && Boolean(firebaseUid);

  // Track auth state
  useEffect(() => {
    if (!auth) {
      setFirebaseUid(null);
      return;
    }
    return auth.onAuthStateChanged((u) => setFirebaseUid(u?.uid ?? null));
  }, []);

  // Load roadmaps
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (useFirestore && dbFirestore) {
      const ref = collection(dbFirestore, "roadmaps");
      const q = query(ref, where("userId", "==", userId));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          const list: PresetRoadmap[] = snap.docs
            .map((d) => {
              const data = d.data() as Record<string, any>;
              const payload = (data.payload as PresetRoadmap) ?? ({} as PresetRoadmap);
              return {
                ...payload,
                id: d.id,
                createdAt:
                  data.createdAt?.toDate?.()?.toISOString?.() ??
                  payload.createdAt ??
                  new Date().toISOString(),
              };
            })
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          knownIdsRef.current = new Set(list.map((r) => r.id));
          setMyRoadmaps(list);
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore roadmaps snapshot failed:", error);
          toast.error("Could not sync your roadmaps from the cloud", {
            description:
              error instanceof Error
                ? error.message
                : "Falling back to this browser's local storage.",
          });
          setMyRoadmaps(readLocalStorage());
          setLoading(false);
        }
      );
      unsubRef.current = unsub;
      return () => {
        cancelled = true;
        unsub();
      };
    }

    // Fallback: localStorage
    const localList = readLocalStorage();
    knownIdsRef.current = new Set(localList.map((r) => r.id));
    setMyRoadmaps(localList);
    setLoading(false);
    return () => {
      cancelled = true;
    };
  }, [userId, useFirestore]);

  const saveRoadmap = useCallback(
    async (roadmap: PresetRoadmap) => {
      // Sanitise once — sanitised payload is safe for Firestore *and*
      // localStorage, and we always keep the caller informed of failures.
      const clean = sanitize(roadmap);

      if (useFirestore && dbFirestore) {
        try {
          const ref = doc(collection(dbFirestore, "roadmaps"), roadmap.id);
          const isNew = !knownIdsRef.current.has(roadmap.id);
          await setDoc(
            ref,
            {
              userId,
              source: "mine" as const,
              title: roadmap.title,
              // Preserve the original creation timestamp on updates.
              ...(isNew ? { createdAt: serverTimestamp() } : {}),
              updatedAt: serverTimestamp(),
              payload: clean,
            },
            { merge: !isNew }
          );
          knownIdsRef.current.add(roadmap.id);
          return { ok: true as const };
        } catch (error) {
          console.error("Failed to save roadmap to Firestore:", error);
          const message =
            error instanceof Error ? error.message : "Unknown Firestore error";
          toast.error("Could not save your roadmap to the cloud", {
            description: `${message}. Saved locally on this device as a backup.`,
          });
          // Fall through to localStorage so the user does not lose progress.
        }
      }

      const existing = readLocalStorage();
      const idx = existing.findIndex((r) => r.id === roadmap.id);
      if (idx >= 0) existing[idx] = clean;
      else existing.unshift(clean);
      writeLocalStorage(existing);
      knownIdsRef.current.add(roadmap.id);
      setMyRoadmaps(existing);
      return { ok: true as const };
    },
    [useFirestore, userId]
  );

  const updateRoadmap = useCallback(
    async (roadmap: PresetRoadmap) => saveRoadmap(roadmap),
    [saveRoadmap]
  );

  const deleteRoadmap = useCallback(
    async (id: string) => {
      if (useFirestore && dbFirestore) {
        try {
          await deleteDoc(doc(collection(dbFirestore, "roadmaps"), id));
          knownIdsRef.current.delete(id);
          return;
        } catch (error) {
          console.error("Failed to delete roadmap in Firestore:", error);
          toast.error("Could not delete your roadmap from the cloud", {
            description:
              error instanceof Error ? error.message : "Removed locally only.",
          });
        }
      }
      const next = readLocalStorage().filter((r) => r.id !== id);
      writeLocalStorage(next);
      knownIdsRef.current.delete(id);
      setMyRoadmaps(next);
    },
    [useFirestore]
  );

  return {
    myRoadmaps,
    loading,
    userId,
    useFirestore,
    saveRoadmap,
    updateRoadmap,
    deleteRoadmap,
  };
}
