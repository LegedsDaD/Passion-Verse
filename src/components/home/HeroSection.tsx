"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface HeroSectionProps {
  onStartInterview: (initialPassion?: string) => void;
  onExploreRoadmaps: () => void;
}

const POPULAR_DREAMS = [
  "Learn a new language",
  "Train for a marathon",
  "Build an Otto robot",
  "Start a small business",
  "Master photography",
  "Improve my fitness",
];

export function HeroSection({ onStartInterview, onExploreRoadmaps }: HeroSectionProps) {
  const [dreamInput, setDreamInput] = React.useState("");

  const ref = React.useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Top content drifts up faster than scroll ("butter" feel)
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  // Logo badge drifts even faster for depth
  const badgeY = useTransform(scrollYProgress, [0, 1], [0, -260]);
  const badgeRotate = useTransform(scrollYProgress, [0, 1], [0, -6]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartInterview(dreamInput.trim() || undefined);
  };

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-[92vh] overflow-hidden bg-grid-pattern"
    >
      {/* Ambient wash — sits behind, does not move */}
      <div className="pointer-events-none absolute inset-0 bg-ambient-wash" />

      {/* Static floating accents (slow pulse, no parallax) */}
      <div className="pointer-events-none absolute left-[8%] top-[22%] h-2 w-2 rounded-full bg-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse" />
      <div className="pointer-events-none absolute right-[12%] top-[30%] h-1.5 w-1.5 rounded-full bg-pink-400/60 shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse" style={{ animationDelay: "0.7s" }} />
      <div className="pointer-events-none absolute left-[20%] top-[68%] h-1 w-1 rounded-full bg-indigo-400/60 animate-pulse" style={{ animationDelay: "1.4s" }} />

      {/* Parallax content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, scale: contentScale }}
        className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8"
      >
        {/* Floating logo badge */}
        <motion.div style={{ y: badgeY, rotate: badgeRotate }} className="mb-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-purple-200 bg-white/80 px-4 py-2 shadow-lg shadow-purple-200/30 backdrop-blur-md dark:border-purple-800/60 dark:bg-neutral-900/80 dark:shadow-purple-900/20">
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image src="/passionverse-logo.png" alt="" fill className="object-cover" priority />
            </div>
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              Follow any passion with a clear plan
            </span>
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          </div>
        </motion.div>

        {/* Display headline — Bricolage Grotesque, strong hierarchy, NOT a gradient paint */}
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-neutral-900 sm:text-7xl lg:text-8xl dark:text-white">
          Follow what
          <br />
          you{" "}
          <span className="relative inline-block italic text-purple-600 dark:text-purple-400">
            love.
            <svg
              className="absolute -bottom-2 left-0 h-3 w-full text-purple-400/60 dark:text-purple-500/60"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M2 8 C 50 2, 150 2, 198 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="mt-8 max-w-2xl text-base text-neutral-600 sm:text-lg dark:text-neutral-400">
          Tell us the goal or passion you want to follow. Gemini asks{" "}
          <span className="font-bold text-neutral-900 dark:text-white">5 focused questions</span>,
          then creates a roadmap with practical steps, budget, timeline, and an AI mentor.
        </p>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-2xl"
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white/90 p-2 shadow-xl shadow-neutral-200/50 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-black/30 sm:flex-row sm:p-2">
            <input
              type="text"
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              placeholder='e.g. "I want to learn Japanese" or "I want to make an Otto robot"'
              className="flex-1 rounded-xl bg-transparent px-4 py-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
            />
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-purple-600 sm:w-auto dark:bg-white dark:text-neutral-900 dark:hover:bg-purple-500 dark:hover:text-white"
            >
              Start My Journey
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </form>

        {/* Quick dream chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {POPULAR_DREAMS.map((dream) => (
            <button
              key={dream}
              onClick={() => onStartInterview(dream)}
              className="rounded-full border border-neutral-200 bg-white/60 px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:-translate-y-0.5 hover:border-purple-400 hover:text-purple-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:text-purple-300"
            >
              {dream}
            </button>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="mt-16 text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-400">
          Scroll ↓
        </div>
      </motion.div>

      {/* Hidden hook for explore nav */}
      <button onClick={onExploreRoadmaps} className="hidden" aria-hidden />
    </section>
  );
}
