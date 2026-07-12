"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "What exactly happens when I click 'Start My Journey'?",
    a: "You'll type your dream (like \"make an Otto robot\" or \"learn 3D modeling\"). Then Gemini creates exactly 5 questions specific to your goal. You answer them one at a time — take your time. Once all 5 are done, we send everything to Gemini at once and it builds your entire personalized roadmap.",
  },
  {
    q: "Do I need any experience to use this?",
    a: "Nope! One of the questions Gemini asks is about your current skill level. Whether you're a complete beginner or already know some stuff — your roadmap will match where you are right now.",
  },
  {
    q: "How long does creating a roadmap take?",
    a: "About 3-5 minutes total. The interview goes fast because each question is focused and relevant to YOUR specific dream. No filler, no generic advice.",
  },
  {
    q: "What if I get stuck on a step in my roadmap?",
    a: "Every single step has an 'Ask Mentor' button. Click it and tell your AI mentor what's confusing you. It'll explain things in simple terms, give you alternatives if something costs too much, or suggest shortcuts if you're short on time.",
  },
  {
    q: "Is this free? What do I need?",
    a: "The app itself is free to use. For AI features, add your own Google Gemini API key (free tier works great) in Vercel's Environment Variables. A Firebase project gives you Google Sign-In and cloud storage for your roadmaps — also free at hobby scale.",
  },
  {
    q: "Do I have to sign in?",
    a: "Yes, once Firebase is configured. Sign-in is what makes saving, syncing, and per-device persistence work reliably — without it your progress would live only in one browser and be easy to lose.",
  },
  {
    q: "Can I change my answers after I start?",
    a: "Yes! Before generating the roadmap, you can go back and edit any of your 5 answers. After the roadmap is made, you can also use the mentor to adjust the plan whenever life changes.",
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  return (
    <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-black text-neutral-900 sm:text-4xl dark:text-white">Questions? We got you.</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Real answers from real usage</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-neutral-200 bg-white transition-colors hover:border-purple-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-purple-800"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-semibold text-neutral-900 dark:text-white sm:text-base">{item.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 ${openIdx === idx ? 'rotate-180 text-purple-500' : ''}`} />
              </button>

              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-neutral-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
