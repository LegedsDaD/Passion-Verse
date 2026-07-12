"use client";

import React from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  ListChecks,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateInterviewQuestionsAction,
  generateRoadmapFromInterviewAction,
} from "@/app/actions/roadmap-actions";
import type { InterviewQuestion, InterviewAnswer } from "@/lib/gemini-types";
import type { PresetRoadmap } from "@/lib/seed-data";

interface AiInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPassion?: string;
  onRoadmapGenerated: (roadmap: PresetRoadmap) => void;
  /** Personal Gemini API key from Settings, if the user has saved one. */
  userGeminiApiKey?: string;
}

export function AiInterviewModal({
  isOpen,
  onClose,
  initialPassion,
  onRoadmapGenerated,
  userGeminiApiKey,
}: AiInterviewModalProps) {
  const [passion, setPassion] = React.useState(initialPassion || "");
  const [questions, setQuestions] = React.useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = React.useState<string[]>(["", "", "", "", ""]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [draft, setDraft] = React.useState("");
  const [loadingQuestions, setLoadingQuestions] = React.useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = React.useState(false);
  const [error, setError] = React.useState("");
  const initializedPassionRef = React.useRef("");

  const interviewComplete = questions.length === 5 && answers.every((answer) => answer.trim());
  const currentQuestion = questions[currentIndex];

  const planQuestions = React.useCallback(async (selectedPassion: string) => {
    const normalized = selectedPassion.trim();
    if (!normalized) {
      setError("Describe what you want to do or achieve first.");
      return;
    }
    setError("");
    setLoadingQuestions(true);
    setQuestions([]);
    setAnswers(["", "", "", "", ""]);
    setCurrentIndex(0);
    setDraft("");
    try {
      const planned = await generateInterviewQuestionsAction(normalized, userGeminiApiKey);
      if (!Array.isArray(planned) || planned.length !== 5) {
        throw new Error("Gemini returned an unexpected interview shape. Please try again.");
      }
      setPassion(normalized);
      setQuestions(planned);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to prepare the interview. Please try again."
      );
    } finally {
      setLoadingQuestions(false);
    }
  }, [userGeminiApiKey]);

  React.useEffect(() => {
    if (!isOpen) {
      initializedPassionRef.current = "";
      return;
    }
    const incoming = initialPassion?.trim() || "";
    setPassion(incoming);
    setQuestions([]);
    setAnswers(["", "", "", "", ""]);
    setCurrentIndex(0);
    setDraft("");
    setError("");

    if (incoming && initializedPassionRef.current !== incoming) {
      initializedPassionRef.current = incoming;
      planQuestions(incoming);
    }
  }, [isOpen, initialPassion, planQuestions]);

  const saveCurrentAnswer = () => {
    if (!draft.trim() || !currentQuestion) {
      setError("Please answer this question before continuing.");
      return;
    }
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = draft.trim();
    setAnswers(nextAnswers);
    setError("");

    if (currentIndex < 4) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setDraft(nextAnswers[nextIndex] || "");
    } else {
      setDraft("");
    }
  };

  const editAnswer = (index: number) => {
    setCurrentIndex(index);
    setDraft(answers[index]);
    setError("");
  };

  const generateRoadmap = async () => {
    if (!interviewComplete) return;
    setGeneratingRoadmap(true);
    setError("");
    const bundledAnswers: InterviewAnswer[] = questions.map((question, index) => ({
      questionId: question.id,
      question: question.question,
      answer: answers[index],
    }));

    try {
      const roadmap = await generateRoadmapFromInterviewAction(
        {
          passion,
          answers: bundledAnswers,
        },
        userGeminiApiKey
      );
      if (!roadmap || !Array.isArray(roadmap.steps) || roadmap.steps.length === 0) {
        throw new Error("The roadmap came back empty. Please try once more.");
      }
      onRoadmapGenerated(roadmap);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Roadmap generation failed. Please try again."
      );
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 p-3 backdrop-blur-md sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className="flex h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
        >
          {questions.length === 5 && (
            <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-neutral-200 bg-neutral-50/70 p-5 dark:border-neutral-800 dark:bg-neutral-900/40 md:block">
              <div className="mb-5">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-300">
                  <ListChecks className="h-4 w-4" /> Interview plan
                </div>
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Gemini prepared exactly five questions for{" "}
                  <strong className="text-neutral-800 dark:text-neutral-100">{passion}</strong>.
                  Answer them in order.
                </p>
              </div>

              <div className="space-y-2.5">
                {questions.map((question, index) => {
                  const answered = Boolean(answers[index]?.trim());
                  const active = index === currentIndex && !interviewComplete;
                  return (
                    <button
                      key={question.id}
                      onClick={() => editAnswer(index)}
                      className={`w-full rounded-2xl border p-3 text-left transition-all ${
                        active
                          ? "border-purple-400 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30"
                          : answered
                          ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20"
                          : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={`font-mono text-xs font-black ${
                            active ? "text-purple-700 dark:text-purple-300" : "text-neutral-400"
                          }`}
                        >
                          {question.id}
                        </span>
                        {answered && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                        {question.label}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {question.question}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-extrabold tracking-tight">
                    PassionVerse interview
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {questions.length === 5
                      ? "Five focused answers create one coherent roadmap"
                      : "Tell us what you want to do, achieve, or explore"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                aria-label="Close interview"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 sm:p-8">
              {questions.length === 0 ? (
                <div className="mx-auto flex h-full max-w-2xl flex-col justify-center">
                  <div className="mb-8 text-center">
                    <span className="mb-4 inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300">
                      Step 1 · Define your passion
                    </span>
                    <h3 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                      What do you want to do or achieve?
                    </h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Your goal is sent to Gemini once. It creates exactly five questions
                      tailored to your situation before any roadmap is generated.
                    </p>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      planQuestions(passion);
                    }}
                    className="rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <textarea
                      value={passion}
                      onChange={(event) => setPassion(event.target.value)}
                      placeholder="Example: I want to learn Japanese, train for a marathon, or make an Otto robot."
                      rows={4}
                      className="w-full resize-none rounded-xl bg-transparent p-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={loadingQuestions || !passion.trim()}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                    >
                      {loadingQuestions ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                      {loadingQuestions ? "Gemini is planning questions 1–5…" : "Create my five questions"}
                    </button>
                  </form>
                </div>
              ) : interviewComplete && !draft ? (
                <div className="mx-auto max-w-3xl space-y-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Check className="h-7 w-7" />
                    </div>
                    <h3 className="font-display text-2xl font-black tracking-tight sm:text-3xl">
                      All five answers are bundled
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      Review your responses. They will be sent together so Gemini can build one
                      consistent roadmap.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <button
                        key={question.id}
                        onClick={() => editAnswer(index)}
                        className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-purple-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-purple-700"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                            {question.id}. {question.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Edit
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{question.question}</p>
                        <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                          {answers[index]}
                        </p>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={generateRoadmap}
                    disabled={generatingRoadmap}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-6 py-4 font-black text-white shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.01] disabled:opacity-60"
                  >
                    {generatingRoadmap ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    {generatingRoadmap ? "Building your personalized roadmap…" : "Send bundle and generate roadmap"}
                  </button>
                </div>
              ) : (
                <div className="mx-auto flex h-full max-w-2xl flex-col justify-center">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300">
                      Question {currentIndex + 1} of 5
                    </span>
                    <span className="text-xs text-neutral-400">
                      {answers.filter(Boolean).length}/5 answered
                    </span>
                  </div>

                  <div className="mb-5 grid grid-cols-5 gap-2">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className={`h-1.5 rounded-full ${
                          answers[index]
                            ? "bg-emerald-500"
                            : index === currentIndex
                            ? "bg-purple-500"
                            : "bg-neutral-200 dark:bg-neutral-800"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-purple-700 dark:text-purple-300">
                      {currentQuestion.label}
                    </div>
                    <h3 className="font-display text-xl font-black leading-snug tracking-tight sm:text-2xl">
                      {currentQuestion.question}
                    </h3>
                    <p className="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Why we ask: {currentQuestion.whyNeeded}
                    </p>

                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Give a clear, honest answer so your roadmap fits your real situation…"
                      rows={6}
                      className="mt-6 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-400 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-white dark:focus:bg-neutral-950"
                      autoFocus
                    />

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        onClick={() => editAnswer(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:invisible dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        <ArrowLeft className="h-4 w-4" /> Previous
                      </button>
                      <button
                        onClick={saveCurrentAnswer}
                        disabled={!draft.trim()}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40"
                      >
                        {currentIndex === 4 ? "Save final answer" : "Save and continue"}
                        {currentIndex === 4 ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center">
                    <button
                      type="button"
                      disabled={!draft.trim()}
                      onClick={saveCurrentAnswer}
                      className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-purple-600 disabled:opacity-40 dark:text-neutral-400 dark:hover:text-purple-300"
                    >
                      <Send className="h-3 w-3" /> Save and continue (Enter)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}
          </section>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
