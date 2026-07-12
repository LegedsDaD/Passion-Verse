"use client";

import React from "react";
import { MessageSquare, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Tell us what you want to do",
    desc: "Share a goal, passion, skill, habit, experience, or project. One sentence is enough.",
    badge: "You → PassionVerse",
  },
  {
    icon: FileText,
    title: "Answer 5 questions",
    desc: "Gemini creates 5 focused questions. Answer them one at a time at your own pace.",
    badge: "Gemini AI",
  },
  {
    icon: Sparkles,
    title: "Get your roadmap",
    desc: "Your answers become a custom plan — steps, budget, timeline, milestones, all in one place.",
    badge: "One click",
  },
  {
    icon: MessageSquare,
    title: "Ask when you're stuck",
    desc: "Each step has a mentor button. Tell it what's blocking you and get a specific, practical answer in seconds.",
    badge: "Text-based help",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-neutral-200/60 px-4 py-20 dark:border-neutral-800/40 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">
            Four steps to your goal
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">Simple, fast, and completely personalized to you.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-1 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-bold text-neutral-900 dark:text-white">{step.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{step.desc}</p>
                <span className="mt-3 inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{step.badge}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
