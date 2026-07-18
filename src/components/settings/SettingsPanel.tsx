"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, loading, saving, saveSettings, usingPersonalGeminiKey } = useUserSettings();

  const [geminiKey, setGeminiKey] = React.useState("");
  const [elevenLabsKey, setElevenLabsKey] = React.useState("");
  const [showGemini, setShowGemini] = React.useState(false);
  const [showElevenLabs, setShowElevenLabs] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [notifState, setNotifState] = React.useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );

  React.useEffect(() => {
    if (typeof Notification !== "undefined") setNotifState(Notification.permission);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setGeminiKey(settings.geminiApiKey);
      setElevenLabsKey(settings.elevenLabsApiKey);
      setJustSaved(false);
    }
    // Only re-sync when the panel opens or the stored settings change while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings.geminiApiKey, settings.elevenLabsApiKey]);

  const handleSave = async () => {
    await saveSettings({
      geminiApiKey: geminiKey.trim(),
      elevenLabsApiKey: elevenLabsKey.trim(),
    });
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2000);
  };

  const handleClear = async () => {
    setGeminiKey("");
    setElevenLabsKey("");
    await saveSettings({ geminiApiKey: "", elevenLabsApiKey: "" });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <header className="flex items-start justify-between border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    API Settings
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Bring your own keys — optional
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your settings…
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Built-in status */}
                  <div
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                      usingPersonalGeminiKey
                        ? "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30"
                        : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    }`}
                  >
                    {usingPersonalGeminiKey ? (
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {usingPersonalGeminiKey
                          ? "Using your personal Gemini key"
                          : "Using the built-in Gemini key"}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                        PassionVerse ships with a working Gemini connection by default. Add your
                        own key below only if you want your requests billed to your own Google
                        account.
                      </p>
                    </div>
                  </div>

                  {/* Gemini key */}
                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      <span>Your Google Gemini API key</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-medium normal-case tracking-normal text-purple-600 hover:underline dark:text-purple-400"
                      >
                        Get a key <ExternalLink className="h-3 w-3" />
                      </a>
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-1.5 focus-within:border-purple-400 dark:border-neutral-700 dark:bg-neutral-900">
                      <input
                        type={showGemini ? "text" : "password"}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="Leave blank to use the built-in key"
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGemini((s) => !s)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:bg-white hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        aria-label={showGemini ? "Hide key" : "Show key"}
                      >
                        {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                {/* Notifications — local, in-tab reminders */}
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <span>Timetable reminders</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof Notification === "undefined") return;
                        const perm = await Notification.requestPermission();
                        setNotifState(perm);
                      }}
                      className="font-medium normal-case tracking-normal text-purple-600 hover:underline dark:text-purple-400"
                    >
                      {notifState === "granted" ? "Enabled" : notifState === "denied" ? "Blocked in browser" : "Allow in browser"}
                    </button>
                  </label>
                  <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    When enabled, PassionVerse schedules local notifications from each roadmap's
                    timetable. They fire while any tab is open; for true background push, follow
                    <code className="mx-1 rounded bg-neutral-100 px-1 py-0.5 font-mono text-[11px] text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">FIREBASE_NOTIFICATIONS.md</code>
                    and deploy the bundled Cloud Function.
                  </p>
                </div>

                {/* ElevenLabs key */}
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <span>Your ElevenLabs API key</span>
                      <a
                        href="https://elevenlabs.io/app/settings/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-medium normal-case tracking-normal text-purple-600 hover:underline dark:text-purple-400"
                      >
                        Get a key <ExternalLink className="h-3 w-3" />
                      </a>
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-1.5 focus-within:border-purple-400 dark:border-neutral-700 dark:bg-neutral-900">
                      <input
                        type={showElevenLabs ? "text" : "password"}
                        value={elevenLabsKey}
                        onChange={(e) => setElevenLabsKey(e.target.value)}
                        placeholder="Optional — stored for future voice features"
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => setShowElevenLabs((s) => !s)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:bg-white hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        aria-label={showElevenLabs ? "Hide key" : "Show key"}
                      >
                        {showElevenLabs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">
                    PassionVerse does not currently have any voice or speaking features. This
                    key is only saved for you — nothing reads it yet.
                  </p>
                </div>

                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Keys are stored privately on your account and sent only to Google's or
                  ElevenLabs' own servers when your requests need them. PassionVerse never
                  shares your keys with other users.
                </p>
              </div>
            )}
          </div>

            <footer className="flex items-center justify-between gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
              <button
                onClick={handleClear}
                disabled={loading || saving || (!geminiKey && !elevenLabsKey)}
                className="text-xs font-semibold text-neutral-500 transition-colors hover:text-red-600 disabled:opacity-40 dark:hover:text-red-400"
              >
                Clear keys
              </button>
              <button
                onClick={handleSave}
                disabled={loading || saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : justSaved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {saving ? "Saving…" : justSaved ? "Saved" : "Save settings"}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
