"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export type RoadmapSource = "mine" | "example";

export function useRoadmaps() {
  const [myRoadmaps, setMyRoadmaps] = useState<PresetRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

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
              return {
                ...(data.payload as PresetRoadmap),
                id: d.id,
                createdAt:
                  data.createdAt?.toDate?.()?.toISOString?.() ??
                  data.payload?.createdAt ??
                  new Date().toISOString(),
              };
            })
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          setMyRoadmaps(list);
          setLoading(false);
        },
        () => {
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
    setMyRoadmaps(readLocalStorage());
    setLoading(false);
    return () => {
      cancelled = true;
    };
  }, [userId, useFirestore]);

  const saveRoadmap = useCallback(
    async (roadmap: PresetRoadmap) => {
      if (useFirestore && dbFirestore) {
        const ref = doc(collection(dbFirestore, "roadmaps"), roadmap.id);
        await setDoc(ref, {
          userId,
          source: "mine",
          title: roadmap.title,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          payload: roadmap,
        });
        return;
      }
      const existing = readLocalStorage();
      const idx = existing.findIndex((r) => r.id === roadmap.id);
      if (idx >= 0) existing[idx] = roadmap;
      else existing.unshift(roadmap);
      writeLocalStorage(existing);
      setMyRoadmaps(existing);
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
        await deleteDoc(doc(collection(dbFirestore, "roadmaps"), id));
        return;
      }
      const next = readLocalStorage().filter((r) => r.id !== id);
      writeLocalStorage(next);
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
