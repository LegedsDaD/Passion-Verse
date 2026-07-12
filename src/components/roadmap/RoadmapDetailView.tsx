"use client";

import React from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  DollarSign,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Send,
  X,
  Loader2,
  BookOpen,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { PresetRoadmap } from "@/lib/seed-data";
import type { RoadmapStepItem } from "@/db/schema";
import { getDifficultyColor } from "@/lib/utils";
import { askAboutStepAction } from "@/app/actions/roadmap-actions";
import { AiMentorDrawer } from "./AiMentorDrawer";

interface RoadmapDetailViewProps {
  roadmap: PresetRoadmap;
  onBack: () => void;
  onUpdateRoadmap: (updated: PresetRoadmap) => void;
  /** Personal Gemini API key from Settings, if the user has saved one. */
  userGeminiApiKey?: string;
}

export function RoadmapDetailView({
  roadmap,
  onBack,
  onUpdateRoadmap,
  userGeminiApiKey,
}: RoadmapDetailViewProps) {
  const [activeTab, setActiveTab] = React.useState<"steps" | "progress">("steps");
  const [selectedStepIdx, setSelectedStepIdx] = React.useState<number | null>(null);
  const [mentorOpen, setMentorOpen] = React.useState(false);
  const [stepMentorQuestion, setStepMentorQuestion] = React.useState("");
  const [stepMentorReply, setStepMentorReply] = React.useState<string | null>(null);
  const [stepMentorLoading, setStepMentorLoading] = React.useState(false);

  const completedSteps = roadmap.steps.filter((s) => s.completed).length;
  const totalSteps = roadmap.steps.length || 1;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  const selectedStep = selectedStepIdx !== null ? roadmap.steps[selectedStepIdx] : null;

  const toggleComplete = (idx: number) => {
    if (!roadmap.steps[idx].completed) {
      confetti({ particleCount: 40, spread: 60 });
    }
    const updated = { ...roadmap };
    updated.steps = updated.steps.map((s, i) =>
      i === idx ? { ...s, completed: !s.completed } : s
    );
    onUpdateRoadmap(updated);
  };

  const toggleMilestone = (mid: string) => {
    const target = roadmap.milestones.find((m) => m.id === mid);
    if (!target?.completed) confetti({ particleCount: 60, spread: 80 });

    const updated = {
      ...roadmap,
      milestones: roadmap.milestones.map((m) =>
        m.id === mid ? { ...m, completed: !m.completed } : m
      ),
    };
    onUpdateRoadmap(updated);
  };

  const handleAskAboutStep = async () => {
    if (!selectedStep || !stepMentorQuestion.trim()) return;
    setStepMentorLoading(true);
    setStepMentorReply(null);
    try {
      const result = await askAboutStepAction(
        `I'm working on Step "${selectedStep.title}" which is about: ${selectedStep.description}. My question is: ${stepMentorQuestion}`,
        roadmap,
        userGeminiApiKey
      );
      setStepMentorReply(result.reply);
      setStepMentorLoading(false);
    } catch {
      setStepMentorReply("I can help with that! Let me look at your specific situation with this step and give you clear guidance.");
      setStepMentorLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back & header */}
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/80 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white hover:text-purple-600 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Roadmap Header */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6 sm:p-8 shadow-sm dark:border-neutral-800 dark:from-purple-950/30 dark:via-neutral-900 dark:to-indigo-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                Your Personalized Roadmap
              </span>
              <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl dark:text-white">{roadmap.title}</h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">&ldquo;{roadmap.goal}&rdquo;</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMentorOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg"
              >
                <MessageSquare className="h-4 w-4" /> Open AI Mentor
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-medium text-neutral-500">
              <span>{completedSteps} of {totalSteps} steps done</span>
              <span className="text-purple-600">{progressPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab("steps")}
            className={`pb-3 text-sm font-bold ${activeTab === "steps" ? "border-b-2 border-purple-500 text-purple-600" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
          >
            Steps ({totalSteps})
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`pb-3 text-sm font-bold ${activeTab === "progress" ? "border-b-2 border-purple-500 text-purple-600" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
          >
            Milestones ({roadmap.milestones.length})
          </button>
        </div>

        {/* STEPS TAB */}
        <AnimatePresence mode="wait">
          {activeTab === "steps" && (
            <motion.div
              key="steps-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Step detail panel when one is selected */}
              {selectedStep && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-800 dark:bg-purple-950/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-purple-500">
                        Step {selectedStep.stepIndex}
                      </span>
                      <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-1">{selectedStep.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedStepIdx(null)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-white hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 mb-4">{selectedStep.description}</p>

                  <p className="text-sm italic text-purple-700/80 dark:text-purple-300/70 mb-5">
                    💡 Why this matters: {selectedStep.whyItMatters}
                  </p>

                  {/* Ask Mentor about this specific step - THE KEY FEATURE */}
                  <div className="rounded-xl border border-purple-200 bg-white p-4 dark:border-purple-800 dark:bg-neutral-900">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-pink-500"/> Ask About This Step
                    </h4>
                    <div className="flex gap-2">
                      <input
                        value={stepMentorQuestion}
                        onChange={(e) => setStepMentorQuestion(e.target.value)}
                        placeholder={`Ask anything about "${selectedStep.title}"...`}
                        className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                        onKeyDown={(e) => e.key === "Enter" && handleAskAboutStep()}
                      />
                      <button
                        onClick={handleAskAboutStep}
                        disabled={stepMentorLoading || !stepMentorQuestion.trim()}
                        className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 shrink-0"
                      >
                        {stepMentorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                    {stepMentorReply && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                      >
                        {stepMentorReply}
                      </motion.div>
                    )}
                  </div>

                  {/* Quick info row */}
                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      ⏱️ {selectedStep.estimatedTime}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      💰 {selectedStep.estimatedCost}
                    </span>
                    <span className={`rounded-full px-3 py-1.5 font-medium ${getDifficultyColor(selectedStep.difficulty).bg} ${getDifficultyColor(selectedStep.difficulty).text}`}>
                      {selectedStep.difficulty}
                    </span>
                    {selectedStep.prerequisites.length > 0 && (
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                        Prerequisites: {selectedStep.prerequisites.join(", ")}
                      </span>
                    )}
                  </div>

                  {/* Helpful tips - collapsed by default */}
                  <details className="mt-4 group">
                    <summary className="cursor-pointer text-xs font-bold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                      ▼ Tips and resources for this step
                    </summary>
                    <div className="mt-3 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {selectedStep.helpfulTips.length > 0 && (
                        <div>
                          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">💡 Tips:</p>
                          <ul className="list-disc pl-4 space-y-1">{selectedStep.helpfulTips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                        </div>
                      )}
                      {selectedStep.commonMistakes.length > 0 && (
                        <div>
                          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">⚠️ Common mistakes:</p>
                          <ul className="list-disc pl-4 space-y-1">{selectedStep.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
                        </div>
                      )}
                      {selectedStep.practiceExercises.length > 0 && (
                        <div>
                          <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">📝 Practice:</p>
                          {selectedStep.practiceExercises.map((ex, i) => (
                            <div key={i} className="rounded-lg border border-neutral-200 p-3 mt-1 dark:border-neutral-700">
                              <p className="font-medium text-neutral-800 dark:text-neutral-200">{ex.title}</p>
                              <p className="text-xs mt-1">{ex.task}</p>
                              {ex.hint && <p className="text-[11px] text-purple-600 italic mt-1">Hint: {ex.hint}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>

                  {/* Mark complete button for this step */}
                  <button
                    onClick={() => {
                      toggleComplete(selectedStepIdx!);
                      setSelectedStepIdx(null);
                    }}
                    className={`mt-5 w-full rounded-xl py-3 font-bold text-sm transition-all ${
                      selectedStep.completed
                        ? "bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:scale-[1.01]"
                    }`}
                  >
                    {selectedStep.completed ? "✅ Completed — Mark Incomplete?" : "✓ Mark This Step Complete"}
                  </button>
                </motion.div>
              )}

              {/* Step list cards - CLEAN and SIMPLE */}
              <div className="space-y-3">
                {roadmap.steps.map((step, idx) => {
                  const isSelected = idx === selectedStepIdx;
                  return (
                    <div
                      key={step.id}
                      className={`group cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-purple-400 bg-purple-50/50 dark:border-purple-700 dark:bg-purple-950/20"
                          : "border-neutral-200 bg-white hover:border-purple-200 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                      }`}
                      onClick={() => setSelectedStepIdx(isSelected ? null : idx)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Complete checkbox */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleComplete(idx); }}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                              step.completed
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-neutral-300 hover:border-purple-400 dark:border-neutral-600"
                            }`}
                          >
                            {step.completed && <Check className="h-3.5 w-3.5" />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-purple-500">
                                Step {step.stepIndex}
                              </span>
                              <span className={`text-[11px] font-bold rounded-md px-1.5 py-0.5 ${getDifficultyColor(step.difficulty).bg} ${getDifficultyColor(step.difficulty).text}`}>
                                {step.difficulty}
                              </span>
                            </div>
                            <h3 className={`font-bold text-sm sm:text-base ${
                              step.completed ? "line-through text-neutral-400 dark:text-neutral-500" : "text-neutral-900 dark:text-white"
                            }`}>
                              {step.title}
                            </h3>
                            {!isSelected && (
                              <p className="mt-1 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                                {step.description.slice(0, 100)}...
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right side actions */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          {!isSelected && (
                            <>
                              <span className="hidden text-xs text-neutral-400 sm:inline-flex gap-1 items-center">
                                <Clock className="h-3.5 w-3.5"/>{step.estimatedTime}
                              </span>
                              <MessageSquare className="h-4 w-4 text-purple-400 group-hover:text-purple-600"/>
                              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-purple-500"/>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "progress" && (
            <motion.div
              key="progress-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {roadmap.milestones.map((ms) => (
                <div
                  key={ms.id}
                  onClick={() => toggleMilestone(ms.id)}
                  className={`cursor-pointer rounded-xl border p-5 transition-all ${
                    ms.completed
                      ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : "border-neutral-200 bg-white hover:border-purple-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-purple-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-neutral-400">Week {ms.targetWeek}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      ms.completed ? "bg-emerald-500 text-white" : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                    }`}>
                      {ms.completed ? "Completed ✓" : "Pending"}
                    </span>
                  </div>
                  <h4 className="font-bold text-neutral-900 dark:text-white">{ms.title}</h4>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{ms.description}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Mentor Drawer (full-width mentor chat) */}
      <AiMentorDrawer
        roadmap={roadmap}
        isOpen={mentorOpen}
        onClose={() => setMentorOpen(false)}
        userGeminiApiKey={userGeminiApiKey}
      />
    </div>
  );
}
