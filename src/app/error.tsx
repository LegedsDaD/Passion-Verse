"use client";

import React from "react";

/**
 * Root-level error boundary for the App Router.
 *
 * Any uncaught error inside the page tree is surfaced here with a graceful
 * recovery UI instead of the generic Next.js production error digest.
 * This keeps the experience consistent with PassionVerse's "no dead ends"
 * philosophy: a broken render never ends the user's session.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("PassionVerse render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300">
        ⚠️
      </div>
      <h1 className="font-display text-3xl font-extrabold">Something went sideways</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
        PassionVerse hit an unexpected rendering problem. Your saved roadmaps are safe in
        Firestore — try refreshing or heading back home.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-600 dark:bg-white dark:text-neutral-900 dark:hover:bg-purple-500"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-bold text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
