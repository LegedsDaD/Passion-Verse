"use client";

import dynamic from "next/dynamic";
import React from "react";

/**
 * The whole app is client-side interactive (Firebase Auth, Firestore
 * listeners, Chrome Notification API, canvas-confetti, localStorage, etc.).
 * Rendering it inside the server worker is what produces the opaque
 * "Server Components render" digest error in production. Skipping SSR
 * entirely turns the page into a clean client-only route — the same shape
 * Vite users are used to — and every dynamic feature works identically.
 */

const ClientApp = dynamic(() => import("../components/app/ClientApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600" />
        <p className="text-sm font-medium">Loading PassionVerse…</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <ClientApp />;
}
