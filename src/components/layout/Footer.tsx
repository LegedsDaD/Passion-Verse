"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-neutral-200/60 bg-white/50 py-16 backdrop-blur-xl dark:border-neutral-800/40 dark:bg-black/30">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        {/* Brand */}
        <div className="space-y-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl">
              <Image
                src="/passionverse-logo.png"
                alt="PassionVerse"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold text-neutral-800 dark:text-white">
              Passion<span className="bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">Verse</span>
            </span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Tell us what you want to do, receive a personalized roadmap, and keep moving toward the passion that matters to you.
          </p>

          <a
            href="https://github.com/LegedsDaD/Passion-Verse"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-all hover:border-purple-400 hover:text-purple-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-purple-500 dark:hover:text-purple-400"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.648-1.337-2.225-.253-4.555-1.113-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            Passion-Verse on GitHub
          </a>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-neutral-800 dark:text-white">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
            <li><Link href="#hero" className="hover:text-purple-500 transition-colors">Start Your Journey</Link></li>
            <li><Link href="#features" className="hover:text-purple-500 transition-colors">How It Works</Link></li>
            <li><Link href="#faq" className="hover:text-purple-500 transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* Tech */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-neutral-800 dark:text-white">Powered By</h4>
          <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
            <li><a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-purple-500 transition-colors">Google Gemini AI <ExternalLink className="h-3 w-3 opacity-50"/></a></li>
            <li><a href="https://firebase.google.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-purple-500 transition-colors">Firebase <ExternalLink className="h-3 w-3 opacity-50"/></a></li>
            <li><a href="https://vercel.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-purple-500 transition-colors">Vercel Deployment <ExternalLink className="h-3 w-3 opacity-50"/></a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-neutral-200/50 px-4 pt-8 text-xs text-neutral-600 sm:flex-row dark:border-neutral-800/40 dark:text-neutral-400">
        <p>© {new Date().getFullYear()} PassionVerse</p>
        <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
          Made with <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" /> by LegedsDaD and AmitManna99
        </div>
      </div>
    </footer>
  );
}
