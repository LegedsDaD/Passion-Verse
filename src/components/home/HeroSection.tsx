"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface HeroSectionProps {
  onStartInterview: (initialPassion?: string) => void;
  onExploreRoadmaps: () => void;
}

/**
 * A small live ticker that cycles through example passions. Clicking a row
 * launches the interview pre-filled. The animation gives the hero a sense
 * of motion without relying on an aurora blob.
 */
function LiveTicker({
  dreams,
  onPick,
}: {
  dreams: string[];
  onPick: (value: string) => void;
}) {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % dreams.length), 3200);
    return () => window.clearInterval(id);
  }, [dreams.length]);
  const active = dreams[index];
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
        <span>Right now, people are asking</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> live
        </span>
      </div>
      <div className="relative h-9 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.button
            key={active}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => onPick(active)}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 text-left font-display text-lg font-bold text-neutral-900 transition-colors hover:text-purple-600 dark:text-white dark:hover:text-purple-300"
          >
            <span className="truncate">{active}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-purple-500" />
          </motion.button>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex gap-1.5">
        {dreams.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i === index ? "bg-purple-500" : "bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            }`}
            aria-label={`Show example ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
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

      {/* Parallax content — asymmetric, editorial, left-aligned */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, scale: contentScale }}
        className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-10"
      >
        {/* Kicker */}
        <motion.div style={{ y: badgeY, rotate: badgeRotate }} className="mb-6 inline-flex w-fit items-center gap-3 rounded-full border border-purple-200 bg-white/80 px-4 py-2 shadow-lg shadow-purple-200/30 backdrop-blur-md dark:border-purple-800/60 dark:bg-neutral-900/80 dark:shadow-purple-900/20">
          <div className="relative h-8 w-8 overflow-hidden rounded-full">
            <Image src="/passionverse-logo.png" alt="" fill className="object-cover" priority />
          </div>
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Follow any passion with a clear plan
          </span>
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
        </motion.div>

        {/* Display headline — asymmetric, oversized, left-aligned */}
        <h1 className="font-display max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.03em] text-neutral-900 sm:text-7xl lg:text-[7.5rem] dark:text-white">
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

        {/* Right-aligned supporting column — breaks the centered trio pattern */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <p className="max-w-xl text-lg leading-relaxed text-neutral-700 sm:text-xl dark:text-neutral-300">
            Tell us, in your own words, what you want to achieve. Gemini reads
            it once and writes{" "}
            <span className="font-bold text-neutral-900 dark:text-white">between three and seven questions</span>{" "}
            — exactly the number it needs for your situation. Nothing is hard-coded.
            Answer them, and you get a complete Markdown roadmap plus a timetable
            you can subscribe to.
          </p>

          {/* Live rotating examples ticker */}
          <LiveTicker dreams={POPULAR_DREAMS} onPick={onStartInterview} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-2xl"
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white/90 p-2 shadow-xl shadow-neutral-200/50 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-black/30 sm:flex-row sm:p-2">
            <input
              id="passion-input"
              type="text"
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              placeholder='e.g. "I want to learn Japanese" or "I want to make an Otto robot"'
              autoComplete="off"
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

        {/* The rotating ticker replaces the centered chip row. See
            <LiveTicker /> definition below the HeroSection export. */}

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
