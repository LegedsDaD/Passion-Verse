"use server";

import { PRESET_ROADMAPS, type PresetRoadmap } from "@/lib/seed-data";
import {
  generateInterviewQuestionsAI,
  generatePersonalizedRoadmapAI,
  askMentorAI,
  type InterviewBundle,
} from "@/lib/gemini";

/**
 * Roadmap server actions — AI only.
 *
 * Persistence is handled client-side via the `useRoadmaps` hook, which writes
 * to Firebase Firestore when configured and to localStorage otherwise.
 *
 * Every action accepts an optional `apiKeyOverride`: when the signed-in user
 * has saved their own Gemini key in Settings, the client passes it through
 * here so their requests use their own key instead of the built-in one.
 */

export async function getPresetRoadmapsAction(): Promise<PresetRoadmap[]> {
  return PRESET_ROADMAPS;
}

export async function generateInterviewQuestionsAction(
  passion: string,
  apiKeyOverride?: string
) {
  const normalizedPassion = passion.trim().slice(0, 300);
  if (!normalizedPassion) {
    throw new Error("Please enter a passion before starting the interview.");
  }
  try {
    return await generateInterviewQuestionsAI(normalizedPassion, apiKeyOverride);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Interview planning failed: ${message}`);
  }
}

export async function generateRoadmapFromInterviewAction(
  bundle: InterviewBundle,
  apiKeyOverride?: string
): Promise<PresetRoadmap> {
  const normalizedBundle: InterviewBundle = {
    passion: bundle.passion.trim().slice(0, 300),
    answers: (bundle.answers ?? [])
      .slice(0, 5)
      .map((item, index) => ({
        questionId: index + 1,
        question: (item?.question ?? "").trim().slice(0, 500),
        answer: (item?.answer ?? "").trim().slice(0, 2000),
      })),
  };

  if (!normalizedBundle.passion || normalizedBundle.answers.length !== 5) {
    throw new Error("A passion and all five interview answers are required.");
  }
  if (normalizedBundle.answers.some((item) => !item.question || !item.answer)) {
    throw new Error("Please answer every interview question before generating your roadmap.");
  }

  try {
    return await generatePersonalizedRoadmapAI(normalizedBundle, apiKeyOverride);
  } catch (cause) {
    console.warn("generateRoadmapFromInterviewAction fell back after an error:", cause);
    // Never let a generation error bubble up as a blank screen: produce a
    // deterministic fallback roadmap so the user always lands somewhere.
    const base = PRESET_ROADMAPS[0];
    const goalAnswer = normalizedBundle.answers.find((a) => a.questionId === 1)?.answer ?? "";
    const timeAnswer = normalizedBundle.answers.find((a) => a.questionId === 3)?.answer ?? "";
    const budgetAnswer = normalizedBundle.answers.find((a) => a.questionId === 4)?.answer ?? "";

    return {
      ...base,
      id: `fallback-${Date.now()}`,
      title: `Personalized Journey: ${normalizedBundle.passion}`,
      goal: goalAnswer || `Follow your passion for ${normalizedBundle.passion} with a clear, staged plan.`,
      estimatedDuration: timeAnswer || base.estimatedDuration,
      estimatedBudget: budgetAnswer || base.estimatedBudget,
      progressPercentage: 0,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      steps: base.steps.map((s) => ({ ...s, completed: false })),
      milestones: base.milestones.map((m) => ({ ...m, completed: false })),
      dailyTasks: base.dailyTasks.map((t) => ({ ...t, completed: false })),
      shoppingList: base.shoppingList.map((s) => ({ ...s, purchased: false })),
    };
  }
}

export async function mentorChatTurnAction(
  userQuestion: string,
  roadmap: PresetRoadmap,
  chatHistory: Array<{ role: "assistant" | "user"; content: string }>,
  apiKeyOverride?: string
) {
  try {
    return await askMentorAI(userQuestion, roadmap, chatHistory, apiKeyOverride);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      reply: `I had trouble reaching the mentor just now (${message}). In the meantime: pick the single smallest action from your current step and do it for 15 minutes. Momentum matters more than perfection.`,
    };
  }
}

export async function askAboutStepAction(
  question: string,
  roadmap: PresetRoadmap,
  apiKeyOverride?: string
) {
  try {
    return await askMentorAI(question, roadmap, [], apiKeyOverride);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return {
      reply: `I could not reach the mentor right now (${message}). For this step, focus on the first listed practice exercise and skim the official documentation link. Come back and ask me again in a moment.`,
    };
  }
}

// ---------------------------------------------------------------------------
// Markdown-native actions (2026 refresh). The legacy JSON actions above are
// kept so older clients and tests continue to compile.
// ---------------------------------------------------------------------------

import {
  generateInterviewPlanAI,
  generateRoadmapAndTimetableAI,
} from "@/lib/gemini";
import type { InterviewPlan } from "@/lib/gemini-types";

export async function generateInterviewPlanAction(
  passion: string,
  apiKeyOverride?: string
): Promise<InterviewPlan> {
  const normalized = passion.trim().slice(0, 300);
  if (!normalized) {
    throw new Error("Please enter a passion before starting the interview.");
  }
  return generateInterviewPlanAI(normalized, apiKeyOverride);
}

/**
 * Given a completed interview plan + the user's answers, ask Gemini for a
 * roadmap Markdown and a timetable Markdown, parse the interactive steps and
 * timetable rows, and return a full PresetRoadmap ready to be persisted.
 */
export async function generateMarkdownRoadmapAction(
  passion: string,
  plan: InterviewPlan,
  answers: string[],
  apiKeyOverride?: string
): Promise<PresetRoadmap> {
  if (!passion.trim() || !plan.questions.length) {
    throw new Error("A passion and a non-empty interview plan are required.");
  }
  if (answers.length !== plan.questions.length) {
    throw new Error("Please answer every question before generating your roadmap.");
  }
  if (answers.some((a) => !a.trim())) {
    throw new Error("Please answer every question before generating your roadmap.");
  }

  try {
    const generated = await generateRoadmapAndTimetableAI(
      passion,
      plan,
      answers,
      apiKeyOverride
    );
    if (!generated.steps.length) {
      throw new Error("Gemini returned a roadmap with no steps; using fallback scaffold.");
    }
    return {
      id: `md-${Date.now()}`,
      title: generated.roadmapTitle,
      goal: generated.roadmapGoal,
      category: generated.roadmapCategory,
      estimatedDuration: generated.estimatedDuration,
      estimatedBudget: generated.estimatedBudget,
      difficulty: generated.difficulty,
      progressPercentage: 0,
      isFavorite: false,
      isPublic: true,
      weeklyPlan: [],
      milestones: generated.steps
        .slice(0, 4)
        .map((s, i) => ({
          id: `m-${i + 1}`,
          title: s.title,
          description: s.whyItMatters || s.description,
          targetWeek: i + 1,
          completed: false,
        })),
      dailyTasks: generated.timetable
        .filter((t) => t.time)
        .slice(0, 7)
        .map((t, i) => ({
          id: `dt-${i + 1}`,
          dayNumber: i + 1,
          title: t.title,
          durationMinutes: t.durationMinutes,
          completed: false,
        })),
      shoppingList: [],
      learningPath: [],
      recommendedProjects: [],
      commonMistakes: [],
      successTips: [],
      steps: generated.steps,
      createdAt: new Date().toISOString(),
      questionMarkdown: plan.markdown,
      roadmapMarkdown: generated.roadmapMarkdown,
      timetableMarkdown: generated.timetableMarkdown,
      timetable: generated.timetable,
    };
  } catch (cause) {
    // The generator already falls back to a Markdown scaffold internally, so
    // reaching here means an unexpected exception. Surface a clear error.
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Roadmap generation failed: ${message}`);
  }
}
