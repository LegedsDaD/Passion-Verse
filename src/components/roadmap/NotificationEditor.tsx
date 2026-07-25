"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Bell,
  Clock,
  Save,
  Loader2,
  Trash2,
  Info,
} from "lucide-react";
import type { PresetRoadmap, PresetRoadmapTimetableEntry } from "@/lib/seed-data";

interface NotificationEditorProps {
  open: boolean;
  onClose: () => void;
  roadmap: PresetRoadmap;
  onSave: (nextTimetable: PresetRoadmapTimetableEntry[]) => Promise<void> | void;
}

const DAY_ORDER: PresetRoadmapTimetableEntry["day"][] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const DAY_TO_JS_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const LEAD_TIME_OPTIONS = [
  { minutes: 0, label: "At the exact time" },
  { minutes: 5, label: "5 min before" },
  { minutes: 15, label: "15 min before" },
  { minutes: 30, label: "30 min before" },
  { minutes: 60, label: "1 hour before" },
];

/**
 * Compute the next ISO timestamp for a given day-of-week + HH:MM in the
 * user's local timezone, offset back by `leadMinutes`. Always returns a
 * moment in the future so re-enabling old rows fires on the next occurrence
 * rather than immediately.
 */
function nextNotifyAt(day: string, time: string, leadMinutes: number): string | null {
  if (!time || !DAY_TO_JS_INDEX.hasOwnProperty(day)) return null;
  const [hh, mm] = time.split(":").map((s) => Number(s));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  const now = new Date();
  const target = new Date(now);
  const targetDow = DAY_TO_JS_INDEX[day];
  const daysAhead = (targetDow - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + daysAhead);
  target.setHours(hh, mm, 0, 0);
  // If today matches but the time has already passed, push to next week.
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 7);
  target.setMinutes(target.getMinutes() - leadMinutes);
  return target.toISOString();
}

interface DraftRow extends PresetRoadmapTimetableEntry {
  leadMinutes: number;
  /** Rows added by the user themselves. */
  custom?: boolean;
}

export function NotificationEditor({ open, onClose, roadmap, onSave }: NotificationEditorProps) {
  const [rows, setRows] = React.useState<DraftRow[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const seed: DraftRow[] = (roadmap.timetable ?? [])
      .filter((r) => r.time) // skip pure weekly rows (no time)
      .map((r) => ({ ...r, leadMinutes: 0 }));
    setRows(seed);
  }, [open, roadmap.timetable]);

  const updateRow = (index: number, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        day: "Mon",
        time: "18:00",
        notifyAt: null,
        title: "Custom study session",
        description: "Personal study block added from Notification editor.",
        durationMinutes: 30,
        notified: true,
        leadMinutes: 0,
        custom: true,
      },
    ]);
  };

  const enableAll = () => setRows((prev) => prev.map((r) => ({ ...r, notified: true })));
  const disableAll = () => setRows((prev) => prev.map((r) => ({ ...r, notified: false })));

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextTimetable: PresetRoadmapTimetableEntry[] = rows.map(
        ({ leadMinutes, custom: _custom, ...row }) => ({
          ...row,
          notifyAt: row.notified ? nextNotifyAt(row.day, row.time, leadMinutes) : row.notifyAt,
        })
      );
      // Preserve any weekly-only rows (rows without a time) from the original.
      const weeklyRows = (roadmap.timetable ?? []).filter((r) => !r.time);
      await onSave([...nextTimetable, ...weeklyRows]);
      toast.success("Notification schedule saved", {
        description: `${nextTimetable.filter((r) => r.notified).length} reminder(s) armed.`,
      });
      onClose();
    } catch (err) {
      toast.error("Could not save schedule", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="notification-editor-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-md"
        >
          <motion.div
            key="notification-editor-panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
          >
            <header className="flex shrink-0 items-start justify-between border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    Notification schedule
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Choose when each session should ping you. Times are local to this device.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                aria-label="Close notification editor"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    Rows toggled on will fire the next time that day + time occurs.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={enableAll}
                    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 font-semibold text-neutral-700 hover:border-purple-300 hover:text-purple-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-purple-600"
                  >
                    Enable all
                  </button>
                  <button
                    onClick={disableAll}
                    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 font-semibold text-neutral-700 hover:border-red-300 hover:text-red-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-red-800"
                  >
                    Disable all
                  </button>
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/40">
                  No timed sessions yet. Add one below to schedule a reminder.
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map((row, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl border p-4 transition-colors ${
                        row.notified
                          ? "border-purple-200 bg-purple-50/60 dark:border-purple-800 dark:bg-purple-950/20"
                          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => updateRow(index, { notified: !row.notified })}
                          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            row.notified
                              ? "border-purple-400 bg-purple-500 text-white"
                              : "border-neutral-300 bg-white text-neutral-400 hover:border-purple-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500"
                          }`}
                          title={row.notified ? "Turn off this reminder" : "Turn on this reminder"}
                        >
                          <Bell className="h-4 w-4" />
                        </button>

                        <div className="min-w-0 flex-1 space-y-3">
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => updateRow(index, { title: e.target.value })}
                            placeholder="Session title"
                            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-neutral-900 hover:border-neutral-200 focus:border-purple-400 focus:outline-none dark:text-white dark:hover:border-neutral-700"
                          />

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Day picker */}
                            <select
                              value={row.day}
                              onChange={(e) => updateRow(index, { day: e.target.value })}
                              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-purple-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            >
                              {DAY_ORDER.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>

                            {/* Time picker */}
                            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                              <Clock className="h-3.5 w-3.5 text-neutral-400" />
                              <input
                                type="time"
                                value={row.time}
                                onChange={(e) => updateRow(index, { time: e.target.value })}
                                className="bg-transparent text-xs font-mono font-semibold text-neutral-800 focus:outline-none dark:text-neutral-100"
                              />
                            </div>

                            {/* Duration */}
                            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                              <input
                                type="number"
                                min={5}
                                max={240}
                                step={5}
                                value={row.durationMinutes}
                                onChange={(e) =>
                                  updateRow(index, {
                                    durationMinutes: Math.max(5, Number(e.target.value) || 30),
                                  })
                                }
                                className="w-14 bg-transparent text-xs font-mono font-semibold text-neutral-800 focus:outline-none dark:text-neutral-100"
                              />
                              <span className="text-[11px] text-neutral-400">min</span>
                            </div>

                            {/* Lead time */}
                            <select
                              value={row.leadMinutes}
                              onChange={(e) =>
                                updateRow(index, { leadMinutes: Number(e.target.value) })
                              }
                              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-purple-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            >
                              {LEAD_TIME_OPTIONS.map((opt) => (
                                <option key={opt.minutes} value={opt.minutes}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            {/* Delete */}
                            <button
                              onClick={() => removeRow(index)}
                              className="ml-auto flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs font-semibold text-neutral-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                              title="Remove this row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={addRow}
                className="mt-4 w-full rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-neutral-500 transition-colors hover:border-purple-300 hover:text-purple-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-purple-600 dark:hover:text-purple-300"
              >
                + Add another session
              </button>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50/60 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/60">
              <button
                onClick={onClose}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : "Save schedule"}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
