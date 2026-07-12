"use client";

import React from "react";
import Image from "next/image";
import { X, ShieldCheck, Cloud, Zap, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface SignInGateProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reason?: string;
}

const BENEFITS = [
  {
    icon: Cloud,
    title: "Synced across your devices",
    detail: "Your roadmaps and progress follow you, on any screen.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    detail: "Only you can read or change the roadmaps under your account.",
  },
  {
    icon: Zap,
    title: "Never lose a step",
    detail: "Completed milestones and answers are saved the moment you change them.",
  },
];

export function SignInGate({ open, onClose, onSuccess, reason }: SignInGateProps) {
  const { signingIn, error, clearError, signInWithGoogle, signInWithRedirectDirect } = useGoogleAuth();
  const [showRedirectOption, setShowRedirectOption] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearError();
      setShowRedirectOption(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClick = async () => {
    const outcome = await signInWithGoogle();
    if (outcome === "success") {
      onSuccess?.();
      onClose();
    } else if (outcome === "error") {
      // Give the user a manual escape hatch after the first failure — this
      // is the "opens and closes" case: popups blocked, COOP, or Safari ITP.
      setShowRedirectOption(true);
    }
    // "redirecting" navigates the whole page away; nothing else to do.
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="signin-gate-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="signin-gate-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 md:grid-cols-[1.05fr_1fr]"
          >
            {/* Left editorial panel */}
            <div className="relative overflow-hidden bg-neutral-950 p-8 text-white sm:p-10">
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
                <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-pink-500/15 blur-3xl" />
                <motion.div
                  className="absolute left-8 right-8 top-1/2 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent"
                  animate={{ x: ["-30%", "30%"] }}
                  transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
              </div>

              <div className="relative flex h-full flex-col">
                <div className="mb-10 flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-xl ring-1 ring-white/10">
                    <Image src="/passionverse-logo.png" alt="" fill className="object-cover" />
                  </div>
                  <span className="font-display text-xl font-extrabold tracking-tight">
                    Passion<span className="text-purple-400">Verse</span>
                  </span>
                </div>

                <h2 className="font-display text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl">
                  Your roadmaps <em className="not-italic text-purple-300">live here.</em>
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-300">
                  Sign in once and every journey, step, and milestone is saved to your account automatically — no export, no manual sync.
                </p>

                <ul className="mt-8 space-y-4">
                  {BENEFITS.map((benefit, idx) => {
                    const Icon = benefit.icon;
                    return (
                      <motion.li
                        key={benefit.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + idx * 0.08 }}
                        className="flex items-start gap-3"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                          <Icon className="h-4 w-4 text-purple-300" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{benefit.title}</div>
                          <div className="text-xs text-neutral-400">{benefit.detail}</div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Right sign-in panel */}
            <div className="relative flex flex-col justify-center p-8 sm:p-10">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-6">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                  Sign in required
                </div>
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                  {reason ?? "Continue with Google to save your progress."}
                </h3>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  One tap. No password. We never sell or share your data.
                </p>
              </div>

              <button
                onClick={handleClick}
                disabled={signingIn}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-bold text-neutral-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg disabled:translate-y-0 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-600"
              >
                <Image
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                {signingIn ? "Signing in…" : "Continue with Google"}
              </button>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {showRedirectOption && (
                <button
                  onClick={() => signInWithRedirectDirect()}
                  className="mt-3 w-full rounded-2xl border border-dashed border-purple-300 px-4 py-3 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
                >
                  Pop-up didn't work? Try full-page sign-in instead
                </button>
              )}

              <button
                onClick={onClose}
                className="mt-5 w-full text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Not now — go back
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
