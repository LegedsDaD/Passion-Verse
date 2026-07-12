"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { SponsorsSection } from "@/components/home/SponsorsSection";
import { FaqSection } from "@/components/home/FaqSection";
import { AiInterviewModal } from "@/components/onboarding/AiInterviewModal";
import { RoadmapCard } from "@/components/roadmap/RoadmapCard";
import { RoadmapDetailView } from "@/components/roadmap/RoadmapDetailView";
import { SignInGate } from "@/components/auth/SignInGate";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { useRoadmaps } from "@/hooks/useRoadmaps";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useUserSettings } from "@/hooks/useUserSettings";
import { PRESET_ROADMAPS, type PresetRoadmap } from "@/lib/seed-data";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Compass, FolderHeart, Sparkles, Search, Plus, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [viewMode, setViewMode] = React.useState<"home" | "explore" | "detail">("home");
  const [activeRoadmap, setActiveRoadmap] = React.useState<PresetRoadmap | null>(null);

  const [isInterviewOpen, setIsInterviewOpen] = React.useState(false);
  const [interviewPassion, setInterviewPassion] = React.useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const { user } = useGoogleAuth();
  const { settings: apiSettings } = useUserSettings();
  const [gateOpen, setGateOpen] = React.useState(false);
  const [gateReason, setGateReason] = React.useState<string | undefined>(undefined);
  const pendingActionRef = React.useRef<(() => void) | null>(null);

  const needsAuth = isFirebaseConfigured && !user;

  const {
    myRoadmaps,
    loading: myLoading,
    saveRoadmap,
    updateRoadmap,
    deleteRoadmap,
  } = useRoadmaps();

  const requireAuth = (callback: () => void, reason?: string) => {
    if (!needsAuth) {
      callback();
      return;
    }
    pendingActionRef.current = callback;
    setGateReason(reason);
    setGateOpen(true);
  };

  const handleStartInterview = (initialPassion?: string) => {
    requireAuth(() => {
      setInterviewPassion(initialPassion);
      setIsInterviewOpen(true);
    }, "Sign in to start a new journey and have it saved to your account.");
  };

  const handleRoadmapGenerated = async (newRoadmap: PresetRoadmap) => {
    await saveRoadmap(newRoadmap);
    setActiveRoadmap(newRoadmap);
    setViewMode("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectRoadmap = (roadmap: PresetRoadmap) => {
    setActiveRoadmap(roadmap);
    setViewMode("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateRoadmap = async (updated: PresetRoadmap) => {
    setActiveRoadmap(updated);
    // Persist locally right away so toggles feel instant even before the
    // Firestore write round-trips back.
    await updateRoadmap(updated);
  };

  const handleDeleteRoadmap = async (id: string) => {
    requireAuth(async () => {
      if (!confirm("Delete this roadmap from My Roadmaps?")) return;
      await deleteRoadmap(id);
      if (activeRoadmap?.id === id) {
        setActiveRoadmap(null);
        setViewMode("explore");
      }
    }, "Sign in to manage your saved roadmaps.");
  };

  const openExplore = () => {
    requireAuth(() => {
      setViewMode("explore");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, "Sign in to see your saved roadmaps and track progress across devices.");
  };

  const goHome = () => {
    setViewMode("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredExamples = PRESET_ROADMAPS.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.goal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMine = myRoadmaps.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.goal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        onGoHome={goHome}
        onExploreRoadmaps={openExplore}
        onOpenSettings={() => setSettingsOpen(true)}
        needsAuth={needsAuth}
        onSignInClick={() => {
          pendingActionRef.current = null;
          setGateReason(undefined);
          setGateOpen(true);
        }}
      />

      <AnimatePresence mode="wait">
        {viewMode === "home" && (
          <motion.main
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <HeroSection
              onStartInterview={handleStartInterview}
              onExploreRoadmaps={openExplore}
            />
            <FeaturesSection />
            <HowItWorksSection />
            <SponsorsSection />
            <FaqSection />
          </motion.main>
        )}

        {viewMode === "explore" && (
          <motion.main
            key="explore"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-7xl space-y-12">
              <div className="flex flex-col gap-6">
                <button
                  onClick={goHome}
                  className="group flex w-fit items-center gap-2 text-sm font-bold text-neutral-500 transition-colors hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to home
                </button>

                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-neutral-500 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-400">
                      <Compass className="h-3.5 w-3.5" /> Dashboard
                    </div>
                    <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-neutral-900 sm:text-5xl dark:text-white">
                      Your journey, <span className="italic text-purple-600 dark:text-purple-400">organized.</span>
                    </h1>
                    <p className="mt-2 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
                      Your saved roadmaps live in one place. Browse example journeys when you need inspiration.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search…"
                        className="w-48 rounded-xl border border-neutral-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm backdrop-blur-sm focus:border-purple-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-white sm:w-56"
                      />
                    </div>
                    <button
                      onClick={() => handleStartInterview()}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Plus className="h-4 w-4" /> New journey
                    </button>
                  </div>
                </header>
              </div>

              {/* My Roadmaps */}
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    <FolderHeart className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                      My Roadmaps
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Synced to your account. Changes save automatically.
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {myRoadmaps.length}
                  </span>
                </div>

                {myLoading ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-56 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
                      />
                    ))}
                  </div>
                ) : filteredMine.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-500 dark:bg-purple-950/40">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-neutral-800 dark:text-white">
                      No journeys yet
                    </h3>
                    <p className="mt-1 mb-5 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
                      Start one by telling us what you want to do. Gemini will ask five questions and build your plan.
                    </p>
                    <button
                      onClick={() => handleStartInterview()}
                      className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:scale-[1.02]"
                    >
                      Start your first journey
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMine.map((rm) => (
                      <div key={rm.id} className="group relative">
                        <RoadmapCard roadmap={rm} onSelect={handleSelectRoadmap} />
                        <button
                          onClick={() => handleDeleteRoadmap(rm.id)}
                          title="Delete from My Roadmaps"
                          className="absolute right-3 top-3 hidden rounded-lg bg-red-500/90 p-2 text-white shadow-md transition-opacity hover:bg-red-500 group-hover:flex"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  or explore
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
              </div>

              {/* Example Roadmaps */}
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <Compass className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                      Example Roadmaps
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Pre-built journeys to explore or get inspired by.
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {filteredExamples.length}
                  </span>
                </div>

                {filteredExamples.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white/50 p-10 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50">
                    No example roadmaps match &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredExamples.map((rm) => (
                      <RoadmapCard key={rm.id} roadmap={rm} onSelect={handleSelectRoadmap} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.main>
        )}

        {viewMode === "detail" && activeRoadmap && (
          <motion.main
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <RoadmapDetailView
              roadmap={activeRoadmap}
              onBack={() => setViewMode("explore")}
              onUpdateRoadmap={handleUpdateRoadmap}
              userGeminiApiKey={apiSettings.geminiApiKey}
            />
          </motion.main>
        )}
      </AnimatePresence>

      <Footer />

      <AiInterviewModal
        isOpen={isInterviewOpen}
        onClose={() => setIsInterviewOpen(false)}
        initialPassion={interviewPassion}
        onRoadmapGenerated={handleRoadmapGenerated}
        userGeminiApiKey={apiSettings.geminiApiKey}
      />

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <SignInGate
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          pendingActionRef.current = null;
        }}
        onSuccess={() => {
          const pending = pendingActionRef.current;
          pendingActionRef.current = null;
          if (pending) window.setTimeout(pending, 80);
        }}
        reason={gateReason}
      />
    </div>
  );
}
