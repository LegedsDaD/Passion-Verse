"use client";

import React from "react";
import { Cpu, Cloud, Database, Code2 } from "lucide-react";

const TECH = [
  { name: "Next.js 15", role: "Fullstack framework", icon: Cloud, color: "from-neutral-800 to-black dark:from-white dark:to-neutral-300" },
  { name: "Google Gemini", role: "AI that plans your questions & roadmap", icon: Cpu, color: "from-purple-600 to-pink-500" },
  { name: "Firebase", role: "Auth + Firestore for your saved journeys", icon: Database, color: "from-amber-500 to-orange-500" },
  { name: "Vercel", role: "Hosting platform (where you add API keys)", icon: Code2, color: "from-black to-neutral-700 dark:from-white dark:to-neutral-400" },
];

export function SponsorsSection() {
  return (
    <section className="border-t border-neutral-200/50 px-4 py-14 dark:border-neutral-800/30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Technology</h3>
        <p className="mb-8 text-xs text-neutral-500 dark:text-neutral-400">Built on proven tools you can trust</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TECH.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.name} className="rounded-xl border border-neutral-100 bg-white/60 p-4 transition-colors hover:border-purple-200 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-purple-800">
                <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${t.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-neutral-800 dark:text-white">{t.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">{t.role}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
