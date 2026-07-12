"use client";

import React from "react";
import { X, CheckCircle2, Clock, DollarSign, Award, BookOpen, Video, FileText, AlertTriangle, Lightbulb, ExternalLink, Play, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { RoadmapStepItem } from "@/db/schema";
import { getDifficultyColor } from "@/lib/utils";
import confetti from "canvas-confetti";

interface StepDetailModalProps {
  step: RoadmapStepItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (stepId: string) => void;
}

export function StepDetailModal({
  step,
  isOpen,
  onClose,
  onToggleComplete,
}: StepDetailModalProps) {
  if (!isOpen || !step) return null;

  const diffStyle = getDifficultyColor(step.difficulty);

  const handleToggle = () => {
    if (!step.completed) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
    onToggleComplete(step.id);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl glass-panel border border-white/15 bg-neutral-900/95 text-white shadow-2xl overflow-hidden"
        >
          {/* Header Bar */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-mono font-bold text-lg shadow-md shadow-purple-500/20">
                {step.stepIndex}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}>
                    {step.difficulty}
                  </span>
                  <span className="text-xs text-neutral-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" /> {step.estimatedTime}
                  </span>
                  <span className="text-xs text-neutral-400 font-semibold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> {step.estimatedCost}
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white mt-1">
                  {step.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
                  step.completed
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25"
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${step.completed ? "fill-emerald-400 text-neutral-900" : ""}`} />
                <span>{step.completed ? "Completed" : "Mark Complete"}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Content Scrollable */}
          <div className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-8">
            {/* Description & Why it Matters */}
            <div className="space-y-4">
              <p className="text-base sm:text-lg text-neutral-200 leading-relaxed font-medium">
                {step.description}
              </p>
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-purple-400 mb-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Why This Step Matters
                </h4>
                <p className="text-sm sm:text-base leading-relaxed text-neutral-200">
                  {step.whyItMatters}
                </p>
              </div>
            </div>

            {/* Grid 2 Columns: Prerequisites & Helpful Tips vs Common Mistakes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Prerequisites & Tips */}
              <div className="space-y-6">
                {step.prerequisites && step.prerequisites.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-blue-400" /> Prerequisites
                    </h4>
                    <ul className="space-y-2">
                      {step.prerequisites.map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-neutral-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.helpfulTips && step.helpfulTips.length > 0 && (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" /> Helpful Success Tips
                    </h4>
                    <ul className="space-y-2">
                      {step.helpfulTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-200">
                          <span className="text-emerald-400 font-bold mt-0.5">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column: Common Mistakes & Practice Exercises */}
              <div className="space-y-6">
                {step.commonMistakes && step.commonMistakes.length > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Common Mistakes to Avoid
                    </h4>
                    <ul className="space-y-2">
                      {step.commonMistakes.map((mis, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-200">
                          <span className="text-amber-400 font-bold mt-0.5">⚠️</span>
                          <span>{mis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.practiceExercises && step.practiceExercises.length > 0 && (
                  <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Practice Exercises & Drills
                    </h4>
                    <div className="space-y-3">
                      {step.practiceExercises.map((ex, i) => (
                        <div key={i} className="p-3 rounded-xl bg-black/30 border border-indigo-500/20 space-y-1">
                          <div className="text-sm font-bold text-white">{ex.title}</div>
                          <div className="text-xs text-neutral-300">{ex.task}</div>
                          {ex.hint && (
                            <div className="text-[11px] text-indigo-300 italic mt-1">
                              <strong>Hint:</strong> {ex.hint}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Curated Resources Section */}
            <div className="space-y-6 pt-4 border-t border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Recommended Videos, Docs & Resources</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* YouTube Videos */}
                {step.recommendedYouTubeVideos && step.recommendedYouTubeVideos.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <Video className="w-4 h-4" /> Recommended YouTube
                    </h4>
                    <div className="space-y-2.5">
                      {step.recommendedYouTubeVideos.map((vid, i) => (
                        <a
                          key={i}
                          href={vid.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 transition-colors group"
                        >
                          <div className="text-xs font-bold text-white group-hover:text-red-400 flex items-center justify-between gap-1">
                            <span className="line-clamp-2">{vid.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
                            <span>📺 {vid.channel}</span>
                            <span>⏱️ {vid.duration}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official Docs */}
                {step.officialDocumentation && step.officialDocumentation.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Official Documentation
                    </h4>
                    <div className="space-y-2.5">
                      {step.officialDocumentation.map((doc, i) => (
                        <a
                          key={i}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 transition-colors group"
                        >
                          <div className="text-xs font-bold text-white group-hover:text-blue-400 flex items-center justify-between gap-1">
                            <span className="line-clamp-2">{doc.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-1">
                            Verified Reference Guide
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Online Resources */}
                {step.onlineResources && step.onlineResources.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Online Tutorials & Tools
                    </h4>
                    <div className="space-y-2.5">
                      {step.onlineResources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 transition-colors group"
                        >
                          <div className="text-xs font-bold text-white group-hover:text-purple-400 flex items-center justify-between gap-1">
                            <span className="line-clamp-2">{res.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-1 uppercase font-mono">
                            ✦ {res.type}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex items-center justify-between shrink-0">
            <span className="text-xs text-neutral-400">
              Check off this step when you feel confident in these exercises and documentation!
            </span>
            <button
              onClick={handleToggle}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                step.completed
                  ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25"
              }`}
            >
              {step.completed ? "Mark as Incomplete" : "Complete Step & Continue →"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
