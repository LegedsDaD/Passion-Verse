"use client";

import React from "react";
import { MessageSquare, Cloud, Target, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Just 5 Questions",
    description: "Gemini crafts 5 specific questions for your dream. No generic templates — we learn about YOU.",
    color: "text-purple-500 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-400",
  },
  {
    icon: Target,
    title: "Your Personal Roadmap",
    description: "Get a custom plan with steps, budget, timeline, and daily tasks built around your life, not someone else's.",
    color: "text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400",
  },
  {
    icon: Cloud,
    title: "Auto-saved & synced",
    description: "Every step you complete, every answer you give — saved to your account instantly. Open any device and pick up where you left off.",
    color: "text-pink-500 bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-800 dark:text-pink-400",
  },
  {
    icon: Zap,
    title: "Ask About Any Step",
    description: "Confused by a step? Click \"Ask Mentor\" and get immediate help specific to that exact task. No more getting stuck.",
    color: "text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400",
  },
  {
    icon: Shield,
    title: "Your Data Stays Yours",
    description: "API keys are handled securely through Vercel. Your roadmaps are private until you choose to share them.",
    color: "text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">
            Built for every kind of passion
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">No complexity. No overwhelm. Just your dream, broken into doable steps.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={`rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${feature.color}`}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border-current">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-bold text-neutral-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
