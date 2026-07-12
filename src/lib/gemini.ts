import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RoadmapStepItem } from "@/db/schema";
import type { PresetRoadmap } from "./seed-data";
import { PRESET_ROADMAPS } from "./seed-data";
import type { InterviewBundle, InterviewQuestion } from "./gemini-types";
import { serverKeys } from "@/config/keys.server";

// Re-export types so existing server-side call sites keep working without
// having to know about gemini-types directly.
export type { InterviewQuestion, InterviewAnswer, InterviewBundle } from "./gemini-types";

/**
 * Resolves which Gemini API key to use for a given request: a user-supplied
 * "bring your own key" (from Settings) takes priority, otherwise we fall
 * back to the app's built-in server key.
 */
function resolveApiKey(apiKeyOverride?: string): string | undefined {
  const trimmed = apiKeyOverride?.trim();
  if (trimmed) return trimmed;
  return serverKeys.geminiApiKey;
}

interface ModelConfig {
  responseMimeType?: "application/json";
  temperature?: number;
  maxOutputTokens?: number;
}

function getModel(apiKeyOverride: string | undefined, config: ModelConfig) {
  const apiKey = resolveApiKey(apiKeyOverride);
  if (!apiKey) return null;
  try {
    const client = new GoogleGenerativeAI(apiKey);
    return client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: config,
    });
  } catch (error) {
    console.warn("Failed to initialize Gemini client:", error);
    return null;
  }
}

/**
 * Gemini is asked for `application/json` responses, but some responses still
 * arrive wrapped in ```json fences or with leading/trailing prose. This
 * strips common wrappers before parsing so a cosmetic formatting quirk never
 * turns into a hard failure for the user.
 */
function parseJsonLenient<T>(text: string): T {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
      ? firstBrace
      : Math.min(firstBrace, firstBracket);
  if (start > 0) cleaned = cleaned.slice(start);

  return JSON.parse(cleaned) as T;
}

function fallbackQuestions(passion: string): InterviewQuestion[] {
  const subject = passion.trim() || "this passion";
  return [
    {
      id: 1,
      label: "Goal",
      question: `What exact result do you want to achieve with ${subject}, and what would success look like to you?`,
      whyNeeded: "Defines a concrete outcome and prevents a generic roadmap.",
    },
    {
      id: 2,
      label: "Starting point",
      question: `What experience do you already have with ${subject}, and which related skills have you used before?`,
      whyNeeded: "Avoids repeating skills you already know.",
    },
    {
      id: 3,
      label: "Time and deadline",
      question: "How many hours can you reliably dedicate each week, and do you have a target completion date?",
      whyNeeded: "Sets a realistic pace and roadmap duration.",
    },
    {
      id: 4,
      label: "Resources and budget",
      question: `What budget, tools, access, materials, equipment, or support do you already have for ${subject}?`,
      whyNeeded: "Keeps the plan realistic and makes the best use of what is already available.",
    },
    {
      id: 5,
      label: "Learning and constraints",
      question: "How do you learn best—video, reading, structured courses, or hands-on projects—and what challenge is most likely to slow you down?",
      whyNeeded: "Personalizes resources, exercises, and risk mitigation.",
    },
  ];
}

export async function generateInterviewQuestionsAI(
  passion: string,
  apiKeyOverride?: string
): Promise<InterviewQuestion[]> {
  const normalizedPassion = passion.trim().slice(0, 300);
  if (!normalizedPassion) return fallbackQuestions("this passion");

  const model = getModel(apiKeyOverride, {
    responseMimeType: "application/json",
    temperature: 0.25,
    maxOutputTokens: 1400,
  });

  if (model) {
    try {
      const prompt = `
You are the planning interviewer for PassionVerse.
The user wants to pursue: "${normalizedPassion}".

Create EXACTLY five concise questions needed to build a safe, practical, personalized roadmap for this specific passion or goal.
First infer whether this is a learning goal, habit, health/fitness goal, career goal, trip or experience, creative pursuit, business goal, or physical/digital project. Adapt vocabulary and resource questions to that type. Never assume the user is building a product.

Examples:
- For "learn Japanese", ask about target proficiency/use case, current level, weekly practice time/deadline, learning resources or budget, and preferred practice style/obstacles.
- For "train for a marathon", ask about target race, current fitness and health limitations, training availability/date, access to equipment/coaching and budget, then motivation/recovery obstacles.
- For "make an Otto robot", ask about desired capabilities, electronics/coding experience, available time, budget and parts owned, then learning preference and safety constraints.

Coverage across the five questions:
1. Exact outcome and the user's personal definition of success.
2. Current starting point, experience, and relevant background.
3. Time available, consistency, and target date.
4. Budget and resources already available (adapt this to the pursuit: tools, access, materials, equipment, courses, support, or location).
5. Preferred way of learning/working plus accessibility, safety, motivation, and expected obstacles.

Do not answer the questions. Do not combine them into one paragraph. Return strict JSON only:
{
  "questions": [
    { "id": 1, "label": "Goal", "question": "...", "whyNeeded": "..." },
    { "id": 2, "label": "Starting point", "question": "...", "whyNeeded": "..." },
    { "id": 3, "label": "Time and deadline", "question": "...", "whyNeeded": "..." },
    { "id": 4, "label": "Resources and budget", "question": "...", "whyNeeded": "..." },
    { "id": 5, "label": "Learning and constraints", "question": "...", "whyNeeded": "..." }
  ]
}`;

      const result = await model.generateContent(prompt);
      const parsed = parseJsonLenient<{ questions?: InterviewQuestion[] }>(
        result.response.text()
      );
      if (
        Array.isArray(parsed.questions) &&
        parsed.questions.length === 5 &&
        parsed.questions.every((question) => Boolean(question?.question?.trim()))
      ) {
        return parsed.questions.map((question, index) => ({
          id: index + 1,
          label: question.label || `Question ${index + 1}`,
          question: question.question.trim(),
          whyNeeded: question.whyNeeded || "Used to personalize your roadmap.",
        }));
      }
      console.warn("Gemini returned an unexpected question shape; using fallback questions.");
    } catch (error) {
      console.warn("Gemini question planning failed; using fallback questions:", error);
    }
  }

  return fallbackQuestions(normalizedPassion);
}

export async function generatePersonalizedRoadmapAI(
  collectedData: InterviewBundle,
  apiKeyOverride?: string
): Promise<PresetRoadmap> {
  const model = getModel(apiKeyOverride, {
    responseMimeType: "application/json",
    temperature: 0.35,
    maxOutputTokens: 8192,
  });

  if (model) {
    try {
      const prompt = `
You are the roadmap architect for PassionVerse.
The user selected this passion: "${collectedData.passion}".
Gemini previously created five planning questions. The user answered them one by one. Here is the complete ordered interview bundle:
${JSON.stringify(collectedData.answers, null, 2)}

Build one coherent, practical roadmap specifically for this passion and these answers.
Rules:
- Treat the five answers as authoritative constraints. Do not invent experience, budget, owned equipment, weekly availability, or deadlines.
- Put prerequisites and safety-critical foundations before assembly or advanced work.
- Respect the stated budget. Separate essential purchases from recommended and optional purchases.
- Match task duration to the user's weekly availability and target date.
- Skip fundamentals the user already knows and explain why each remaining step matters.
- Use subject-specific terminology. If this is a physical build such as an Otto robot, include components, wiring, assembly, programming, calibration, testing, troubleshooting, and safe power practices as appropriate.
- Recommend credible official documentation and useful learning resources. Never fabricate a URL; use a stable publisher/home/documentation URL when an exact deep link is uncertain.
- Return strict JSON only, without markdown fences.

Return STRICT JSON matching this exact structure:
{
  "title": "Clear, inspiring title (e.g. 'Mastering Full-Stack Autonomous AI Systems')",
  "goal": "Specific concrete goal summarizing their desired outcome",
  "category": "One of: Code & AI, Film & Photo, Music & Audio, Craft & Culinary, Gaming & Design, Business & Startup, Fitness & Health",
  "estimatedDuration": "e.g. '10 Weeks' or '6 Months'",
  "estimatedBudget": "e.g. '$150 total' or '$0 (Free tier tools)'",
  "difficulty": "One of: Beginner, Intermediate, Advanced, Expert",
  "weeklyPlan": [
    { "weekNumber": 1, "title": "...", "focus": "...", "tasks": ["task 1", "task 2", "task 3"] },
    { "weekNumber": 2, "title": "...", "focus": "...", "tasks": ["task 1", "task 2"] },
    { "weekNumber": 3, "title": "...", "focus": "...", "tasks": ["task 1", "task 2"] },
    { "weekNumber": 4, "title": "...", "focus": "...", "tasks": ["task 1", "task 2"] }
  ],
  "milestones": [
    { "id": "m-1", "title": "First Functional Prototype", "description": "...", "targetWeek": 2, "completed": false },
    { "id": "m-2", "title": "Mid-Journey Checkpoint", "description": "...", "targetWeek": 4, "completed": false }
  ],
  "dailyTasks": [
    { "id": "dt-1", "dayNumber": 1, "title": "...", "durationMinutes": 30, "completed": false },
    { "id": "dt-2", "dayNumber": 2, "title": "...", "durationMinutes": 45, "completed": false },
    { "id": "dt-3", "dayNumber": 3, "title": "...", "durationMinutes": 60, "completed": false }
  ],
  "shoppingList": [
    { "id": "sl-1", "item": "...", "estimatedCost": "$20", "priority": "Essential", "purchased": false },
    { "id": "sl-2", "item": "...", "estimatedCost": "$0", "priority": "Recommended", "purchased": false }
  ],
  "learningPath": [
    { "stage": "Stage 1: Core Foundation", "description": "...", "resourcesCount": 5 },
    { "stage": "Stage 2: Practical Application", "description": "...", "resourcesCount": 7 }
  ],
  "recommendedProjects": [
    { "id": "rp-1", "title": "...", "description": "...", "difficulty": "Intermediate", "expectedOutcome": "..." },
    { "id": "rp-2", "title": "...", "description": "...", "difficulty": "Advanced", "expectedOutcome": "..." }
  ],
  "commonMistakes": [
    "Common mistake 1 and how to avoid it",
    "Common mistake 2 and how to avoid it",
    "Common mistake 3 and how to avoid it"
  ],
  "successTips": [
    "Success tip 1 for daily consistency",
    "Success tip 2 for effective practice"
  ],
  "steps": [
    {
      "id": "step-1",
      "stepIndex": 1,
      "title": "Foundation Setup & First Sprint",
      "description": "...",
      "whyItMatters": "...",
      "estimatedTime": "4 hours",
      "difficulty": "Beginner",
      "prerequisites": ["Prereq 1", "Prereq 2"],
      "estimatedCost": "$0",
      "helpfulTips": ["Tip 1", "Tip 2"],
      "commonMistakes": ["Mistake 1"],
      "onlineResources": [{ "title": "Official Doc", "url": "https://example.com", "type": "Docs" }],
      "recommendedYouTubeVideos": [{ "title": "Deep Dive Tutorial", "url": "https://youtube.com", "channel": "Expert Channel", "duration": "18:20" }],
      "officialDocumentation": [{ "title": "Reference Manual", "url": "https://example.com" }],
      "practiceExercises": [{ "title": "First Hands-On Drill", "task": "...", "hint": "..." }],
      "completed": false
    },
    {
      "id": "step-2",
      "stepIndex": 2,
      "title": "Intermediate Core Skills & Project Architecture",
      "description": "...",
      "whyItMatters": "...",
      "estimatedTime": "6 hours",
      "difficulty": "Intermediate",
      "prerequisites": ["Step 1 completed"],
      "estimatedCost": "$15",
      "helpfulTips": ["Tip 1"],
      "commonMistakes": ["Mistake 1"],
      "onlineResources": [{ "title": "Advanced Guide", "url": "https://example.com", "type": "Guide" }],
      "recommendedYouTubeVideos": [{ "title": "Step 2 Masterclass", "url": "https://youtube.com", "channel": "Top Creator", "duration": "22:15" }],
      "officialDocumentation": [{ "title": "API Specification", "url": "https://example.com" }],
      "practiceExercises": [{ "title": "Real-World Challenge", "task": "...", "hint": "..." }],
      "completed": false
    },
    {
      "id": "step-3",
      "stepIndex": 3,
      "title": "Advanced Mastery & Portfolio Launch",
      "description": "...",
      "whyItMatters": "...",
      "estimatedTime": "8 hours",
      "difficulty": "Advanced",
      "prerequisites": ["Step 2 completed"],
      "estimatedCost": "$0",
      "helpfulTips": ["Tip 1"],
      "commonMistakes": ["Mistake 1"],
      "onlineResources": [{ "title": "Launch Checklist", "url": "https://example.com", "type": "Checklist" }],
      "recommendedYouTubeVideos": [{ "title": "Final Showcase Strategies", "url": "https://youtube.com", "channel": "Pro Mentor", "duration": "14:50" }],
      "officialDocumentation": [{ "title": "Deployment Best Practices", "url": "https://example.com" }],
      "practiceExercises": [{ "title": "Capstone Exercise", "task": "...", "hint": "..." }],
      "completed": false
    }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const parsed = parseJsonLenient<Partial<PresetRoadmap>>(result.response.text());
      return normalizeRoadmap(parsed, collectedData);
    } catch (error) {
      console.warn("Gemini roadmap generation failed; using fallback roadmap:", error);
    }
  }

  // Resilient fallback when no Gemini key is available or the call failed.
  const passionStr = collectedData.passion.toLowerCase();
  const answer = (id: number) =>
    collectedData.answers.find((item) => item.questionId === id)?.answer?.trim() || "";
  let basePreset = PRESET_ROADMAPS[0];
  if (passionStr.includes("drone") || passionStr.includes("film") || passionStr.includes("photo") || passionStr.includes("video")) {
    basePreset = PRESET_ROADMAPS[1];
  } else if (passionStr.includes("coffee") || passionStr.includes("food") || passionStr.includes("cooking")) {
    basePreset = PRESET_ROADMAPS[2];
  } else if (passionStr.includes("game") || passionStr.includes("unity") || passionStr.includes("godot")) {
    basePreset = PRESET_ROADMAPS[3];
  }

  return {
    ...basePreset,
    id: `custom-${Date.now()}`,
    title: `Personalized Journey: ${collectedData.passion}`,
    goal: answer(1) || `Build practical mastery in ${collectedData.passion}.`,
    estimatedDuration: answer(3) || basePreset.estimatedDuration,
    estimatedBudget: answer(4) || basePreset.estimatedBudget,
    progressPercentage: 0,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    steps: basePreset.steps.map((s) => ({ ...s, completed: false })),
    milestones: basePreset.milestones.map((m) => ({ ...m, completed: false })),
    dailyTasks: basePreset.dailyTasks.map((t) => ({ ...t, completed: false })),
    shoppingList: basePreset.shoppingList.map((s) => ({ ...s, purchased: false })),
  };
}

function normalizeRoadmap(
  parsed: Partial<PresetRoadmap>,
  collectedData: InterviewBundle
): PresetRoadmap {
  const base = PRESET_ROADMAPS[0];
  const answer = (id: number) =>
    collectedData.answers.find((item) => item.questionId === id)?.answer?.trim() ?? "";

  const weeklyPlan = Array.isArray(parsed.weeklyPlan) && parsed.weeklyPlan.length
    ? parsed.weeklyPlan
    : base.weeklyPlan;
  const milestones = Array.isArray(parsed.milestones) && parsed.milestones.length
    ? parsed.milestones.map((m) => ({ ...m, completed: false }))
    : base.milestones.map((m) => ({ ...m, completed: false }));
  const dailyTasks = Array.isArray(parsed.dailyTasks) && parsed.dailyTasks.length
    ? parsed.dailyTasks.map((t) => ({ ...t, completed: false }))
    : base.dailyTasks.map((t) => ({ ...t, completed: false }));
  const shoppingList = Array.isArray(parsed.shoppingList) && parsed.shoppingList.length
    ? parsed.shoppingList.map((s) => ({ ...s, purchased: false }))
    : base.shoppingList.map((s) => ({ ...s, purchased: false }));
  const learningPath = Array.isArray(parsed.learningPath) && parsed.learningPath.length
    ? parsed.learningPath
    : base.learningPath;
  const recommendedProjects =
    Array.isArray(parsed.recommendedProjects) && parsed.recommendedProjects.length
      ? parsed.recommendedProjects
      : base.recommendedProjects;
  const commonMistakes = Array.isArray(parsed.commonMistakes) && parsed.commonMistakes.length
    ? parsed.commonMistakes
    : base.commonMistakes;
  const successTips = Array.isArray(parsed.successTips) && parsed.successTips.length
    ? parsed.successTips
    : base.successTips;
  const steps = Array.isArray(parsed.steps) && parsed.steps.length
    ? parsed.steps.map((s, i) => ({
        ...s,
        id: s.id ?? `step-${i + 1}`,
        stepIndex: s.stepIndex ?? i + 1,
        completed: false,
        prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites : [],
        helpfulTips: Array.isArray(s.helpfulTips) ? s.helpfulTips : [],
        commonMistakes: Array.isArray(s.commonMistakes) ? s.commonMistakes : [],
        onlineResources: Array.isArray(s.onlineResources) ? s.onlineResources : [],
        recommendedYouTubeVideos: Array.isArray(s.recommendedYouTubeVideos)
          ? s.recommendedYouTubeVideos
          : [],
        officialDocumentation: Array.isArray(s.officialDocumentation)
          ? s.officialDocumentation
          : [],
        practiceExercises: Array.isArray(s.practiceExercises) ? s.practiceExercises : [],
      }))
    : base.steps.map((s) => ({ ...s, completed: false }));

  return {
    id: `custom-${Date.now()}`,
    title: parsed.title || `Personalized Journey: ${collectedData.passion}`,
    goal: parsed.goal || answer(1) || `Follow your passion for ${collectedData.passion}.`,
    category: parsed.category || base.category,
    estimatedDuration: parsed.estimatedDuration || answer(3) || base.estimatedDuration,
    estimatedBudget: parsed.estimatedBudget || answer(4) || base.estimatedBudget,
    difficulty: parsed.difficulty || base.difficulty,
    progressPercentage: 0,
    isFavorite: false,
    isPublic: true,
    weeklyPlan,
    milestones,
    dailyTasks,
    shoppingList,
    learningPath,
    recommendedProjects,
    commonMistakes,
    successTips,
    steps,
    createdAt: new Date().toISOString(),
  };
}

export async function askMentorAI(
  userQuestion: string,
  roadmap: PresetRoadmap,
  chatHistory: Array<{ role: "assistant" | "user"; content: string }>,
  apiKeyOverride?: string
): Promise<{ reply: string; adaptedStep?: Partial<RoadmapStepItem> }> {
  const model = getModel(apiKeyOverride, {
    temperature: 0.6,
    responseMimeType: "application/json",
  });

  if (model) {
    try {
      const prompt = `
You are the AI Mentor & Coach for the user's roadmap: "${roadmap.title}".
Roadmap goal: "${roadmap.goal}"

User asks: "${userQuestion}"

Chat history:
${chatHistory.map((h) => `${h.role}: ${h.content}`).join("\n")}

Respond with empathetic, intelligent, text-only advice and adapt the plan if requested. Do not reference voice features.
Examples of common user situations:
- "I only have 30 minutes today." -> Suggest a micro-task or high-impact focus drill.
- "I cannot afford this component." -> Suggest open-source, free, or low-cost alternatives immediately.
- "I already know Python / React." -> Skip fundamentals and suggest an advanced shortcut or accelerated challenge.
- "I want an alternative." -> Provide a creative pivot.

Return STRICT JSON:
{
  "reply": "Warm, encouraging, highly specific mentor response (markdown supported)",
  "adaptedStep": null
}
`;

      const result = await model.generateContent(prompt);
      const parsed = parseJsonLenient<{ reply?: string; adaptedStep?: Partial<RoadmapStepItem> }>(
        result.response.text()
      );
      if (parsed?.reply) {
        return { reply: parsed.reply, adaptedStep: parsed.adaptedStep };
      }
      console.warn("Gemini mentor reply had no `reply` field; using fallback mentor logic.");
    } catch (error) {
      console.warn("Gemini mentor call failed; using fallback mentor logic:", error);
    }
  }

  // High-fidelity fallback mentor logic — used when no key is configured,
  // the model call fails, or the response could not be parsed.
  const qLower = userQuestion.toLowerCase();
  if (qLower.includes("30 min") || qLower.includes("time") || qLower.includes("busy") || qLower.includes("today")) {
    return {
      reply: `**No problem at all! Micro-progress beats zero-progress every single time.**\n\nSince you only have a brief window today, let's bypass the full setup and do a high-impact **30-minute Sprint**:\n1. **First 10 minutes:** Review the official documentation quick-reference card for Step 1.\n2. **Next 15 minutes:** Complete just *One Practice Exercise* without getting stuck in perfectionism.\n3. **Final 5 minutes:** Log your key takeaway in your notes.\n\nYou're staying consistent, and that's what separates people who finish from those who don't.`,
    };
  } else if (qLower.includes("afford") || qLower.includes("budget") || qLower.includes("cost") || qLower.includes("free") || qLower.includes("money")) {
    return {
      reply: `**Let's protect your wallet.** You do not need expensive tools to make progress here.\n\nA few free or low-cost paths for "${roadmap.title}":\n- Prefer open-source tools and free tiers first.\n- Replace paid courses with the official docs and YouTube walkthroughs already linked in your steps.\n- Buy only what unlocks the next milestone, not everything upfront.\n\nTell me the exact line item you want to replace and I'll suggest a concrete free alternative.`,
    };
  } else if (qLower.includes("already know") || qLower.includes("skip") || qLower.includes("intermediate") || qLower.includes("advanced")) {
    return {
      reply: `**Great — let's use that foundation.**\n\nSkip the introductory material in your current step and jump straight to its *Practice Exercises* and *Common Mistakes* sections. If those feel easy, mark the step complete and move on; if one of them surprises you, you've found the gap worth closing.\n\nWant me to point you at the next milestone you should aim for instead?`,
    };
  }

  return {
    reply: `Here's how I'd approach that for **${roadmap.title}**:\n\n1. Anchor to one concrete outcome for today — something you can finish in one sitting.\n2. Use the official documentation link on the active step for the canonical answer, not a random blog post.\n3. When in doubt, do the smallest possible version first, then iterate.\n\nShare a bit more about where you're stuck (a step number, an error, or a decision you're weighing) and I'll get specific.`,
  };
}
