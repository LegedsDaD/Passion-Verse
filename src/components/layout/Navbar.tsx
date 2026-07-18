"use client";

import React from "react";
import Image from "next/image";
import { Compass, User, LogOut, ChevronDown, Settings, AlertCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface NavbarProps {
  onExploreRoadmaps?: () => void;
  onGoHome?: () => void;
  onOpenSettings?: () => void;
  needsAuth?: boolean;
  onSignInClick?: () => void;
}

export function Navbar({
  onExploreRoadmaps,
  onGoHome,
  onOpenSettings,
  needsAuth,
  onSignInClick,
}: NavbarProps) {
  const { user, signingIn, error, clearError, signInWithGoogle, signInWithRedirectDirect, signOutUser } =
    useGoogleAuth();
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [showRedirectOption, setShowRedirectOption] = React.useState(false);
  const authMenuRef = React.useRef<HTMLDivElement | null>(null);
  // Defer listener attachment so the opening click cannot immediately trigger
  // a close via the same pointer event.
  const listenersArmedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isAuthOpen) {
      listenersArmedRef.current = false;
      setShowRedirectOption(false);
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!listenersArmedRef.current) return;
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setIsAuthOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAuthOpen(false);
    };

    // Arm on the next frame so the click that opened the menu has fully
    // propagated before we start watching for outside taps.
    const rafId = window.requestAnimationFrame(() => {
      listenersArmedRef.current = true;
    });

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isAuthOpen]);

  const handleGoogleSignIn = async () => {
    if (onSignInClick && needsAuth) {
      setIsAuthOpen(false);
      onSignInClick();
      return;
    }
    clearError();
    const outcome = await signInWithGoogle();
    if (outcome === "success") {
      setIsAuthOpen(false);
    } else if (outcome === "error") {
      setShowRedirectOption(true);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setIsAuthOpen(false);
  };

  const handleAccountClick = () => {
    if (needsAuth && !user) {
      // Send the user to the proper full-screen gate instead of the tiny dropdown.
      onSignInClick?.();
      return;
    }
    setIsAuthOpen((open) => !open);
  };

  return (
    <header className="relative z-30 w-full px-3 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-neutral-200/80 bg-white/80 px-3 py-2.5 shadow-lg shadow-neutral-200/30 backdrop-blur-xl transition-colors dark:border-white/5 dark:bg-neutral-900/85 dark:shadow-black/20 sm:px-4">
        <button
          onClick={onGoHome}
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-xl">
            <Image
              src="/passionverse-logo.png"
              alt="PassionVerse Logo"
              fill
              className="object-cover transition-transform group-hover:scale-110"
              priority
            />
          </div>
          <span className="font-display text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Passion<span className="text-purple-600 dark:text-purple-400">Verse</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={onExploreRoadmaps}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white/80 px-3 text-xs font-bold text-neutral-700 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:border-purple-700 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 sm:px-4 sm:text-sm"
          >
            <Compass className="h-4 w-4 text-purple-500" />
            <span>Roadmaps</span>
          </button>

          <button
            onClick={() => {
              if (needsAuth && !user) {
                onSignInClick?.();
                return;
              }
              onOpenSettings?.();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white/80 text-neutral-600 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:border-purple-700 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
            aria-label="API settings"
            title="API Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          <div className="relative" ref={authMenuRef}>
            <button
              onClick={handleAccountClick}
              className={`flex h-10 items-center gap-2 rounded-xl border p-1.5 pr-2.5 transition-all sm:pr-3 ${
                isAuthOpen
                  ? "border-purple-400 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-950/40 dark:text-purple-300"
                  : needsAuth && !user
                  ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                  : "border-neutral-200 bg-white/80 text-neutral-800 hover:border-purple-300 dark:border-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-100 dark:hover:border-purple-700"
              }`}
              aria-label="Account and sign-in options"
              aria-expanded={isAuthOpen}
            >
              {user?.photoURL ? (
                // We deliberately use a plain <img> here instead of next/image because
                // the URL can be a Googleusercontent link that occasionally returns a
                // 403 during the first SSR render when the image optimizer has not yet
                // cached it. A native <img> never throws and keeps the whole navbar
                // resilient.
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Account"}
                  width={28}
                  height={28}
                  className="rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
              <span className="hidden text-xs font-semibold sm:inline">
                {user?.displayName?.split(" ")[0] || (needsAuth ? "Sign in to save" : "Sign In")}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  isAuthOpen ? "rotate-180 text-purple-500" : "text-neutral-400"
                }`}
              />
            </button>

            {isAuthOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 text-neutral-900 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                {user ? (
                  <>
                    <div className="mb-2 rounded-xl bg-purple-50 p-3 dark:bg-purple-950/30">
                      <p className="truncate text-sm font-bold text-neutral-900 dark:text-white">
                        {user.displayName || "PassionVerse member"}
                      </p>
                      <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mb-2 px-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Sign in to sync your roadmaps across devices.
                    </p>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={signingIn}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
                    >
                      <Image
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        width={16}
                        height={16}
                      />
                      {signingIn ? "Signing in…" : "Continue with Google"}
                    </button>

                    {error && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {showRedirectOption && (
                      <button
                        onClick={() => signInWithRedirectDirect()}
                        className="mt-2 w-full rounded-lg border border-dashed border-purple-300 px-2.5 py-2 text-[11px] font-semibold text-purple-700 transition-colors hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
                      >
                        Pop-up blocked? Try full-page sign-in
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
