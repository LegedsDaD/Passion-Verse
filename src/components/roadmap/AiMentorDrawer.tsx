"use client";

import React from "react";
import { X, Send, Sparkles, MessageSquare, Bot, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PresetRoadmap } from "@/lib/seed-data";
import { mentorChatTurnAction } from "@/app/actions/roadmap-actions";

interface AiMentorDrawerProps {
  roadmap: PresetRoadmap;
  isOpen: boolean;
  onClose: () => void;
  /** Personal Gemini API key from Settings, if the user has saved one. */
  userGeminiApiKey?: string;
}

const QUICK_PROMPTS = [
  "I only have 30 minutes today — what should I do?",
  "I cannot afford the listed tools. Free alternatives?",
  "I already know some of this. Can I skip ahead?",
  "Give me a different approach for the current step.",
];

export function AiMentorDrawer({ roadmap, isOpen, onClose, userGeminiApiKey }: AiMentorDrawerProps) {
  const [messages, setMessages] = React.useState<
    Array<{ role: "assistant" | "user"; content: string }>
  >([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fresh conversation whenever the drawer opens for a (possibly different) roadmap.
  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = `Hi — I'm your mentor for **${roadmap.title}**.\n\nI know your goal, your current step, and your schedule. Ask me anything: how to start today, cheaper alternatives, what to skip, or how to get unstuck.`;
      setMessages([{ role: "assistant", content: welcome }]);
    }
  }, [isOpen, roadmap.id, roadmap.title]);

  // Reset transcript when the drawer fully closes so the next open starts fresh.
  React.useEffect(() => {
    if (!isOpen) {
      const t = window.setTimeout(() => setMessages([]), 200);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    const newHistory = [...messages, { role: "user" as const, content: textToSend }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const mentorResp = await mentorChatTurnAction(textToSend, roadmap, newHistory, userGeminiApiKey);
      const reply =
        (mentorResp && typeof mentorResp === "object" && "reply" in mentorResp && mentorResp.reply) ||
        (typeof mentorResp === "string" ? mentorResp : null) ||
        "I'm here — could you rephrase that so I can give you a precise answer?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.warn("Mentor chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I had trouble reaching the mentor just now. Try again in a moment — or pick the smallest action in your current step and do it for 15 minutes while we reconnect.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-neutral-200 bg-white text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-extrabold tracking-tight">Your AI Mentor</h3>
              <p className="line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">{roadmap.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            aria-label="Close mentor"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "rounded-tl-sm border border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
                      <Sparkles className="h-3 w-3" /> Mentor
                    </div>
                  )}
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && !loading && (
            <div className="flex flex-wrap gap-2 px-5 pb-3">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  onClick={() => handleSend(qp)}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:text-purple-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-purple-600 dark:hover:text-purple-300"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="shrink-0 border-t border-neutral-200 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-1.5 focus-within:border-purple-400 dark:border-neutral-700 dark:bg-neutral-900">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask your mentor anything about this roadmap…"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
              <ShieldCheck className="h-3 w-3" />
              Conversations stay private to your account.
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
