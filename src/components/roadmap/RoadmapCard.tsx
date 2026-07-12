"use client";

import React from "react";
import { Clock, DollarSign, Award, ChevronRight, Star, CheckCircle2 } from "lucide-react";
import type { PresetRoadmap } from "@/lib/seed-data";
import { getDifficultyColor } from "@/lib/utils";

interface RoadmapCardProps {
  roadmap: PresetRoadmap;
  onSelect: (roadmap: PresetRoadmap) => void;
}

export function RoadmapCard({ roadmap, onSelect }: RoadmapCardProps) {
  const diffStyle = getDifficultyColor(roadmap.difficulty);
  const completedSteps = roadmap.steps.filter((s) => s.completed).length;
  const totalSteps = roadmap.steps.length || 1;
  const calculatedProgress = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div
      onClick={() => onSelect(roadmap)}
      className="rounded-3xl glass-card p-6 sm:p-7 flex flex-col justify-between cursor-pointer group glow-border hover:shadow-xl transition-all"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}>
            {roadmap.difficulty}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>{roadmap.estimatedDuration}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-purple-500 transition-colors line-clamp-2">
          {roadmap.title}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6 line-clamp-3">
          {roadmap.goal}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>{roadmap.estimatedBudget}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>{roadmap.milestones.length} Milestones</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Open CTA */}
      <div className="pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
          <span>Progress Mastery</span>
          <span className="text-purple-600 dark:text-purple-400">{calculatedProgress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${calculatedProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
          <span>Launch Roadmap & Mentor</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
