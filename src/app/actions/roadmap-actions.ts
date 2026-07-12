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
