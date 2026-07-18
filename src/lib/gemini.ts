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

// ---------------------------------------------------------------------------
// Markdown-native pipeline (2026 refresh)
//
//   1. User types a passion.
//   2. Gemini is asked to write a Markdown "interview plan" with 3–7 numbered
//      questions of the form `1. **Label** — Question text?`.
//   3. The UI renders that Markdown verbatim and asks the user each question.
//   4. The answers are bundled back to Gemini, which returns two Markdown
//      documents: the roadmap and the timetable. The roadmap's H2 headings
//      are parsed into interactive steps; the timetable's rows are parsed
//      into scheduled FCM local notifications.
//
// Legacy JSON pipeline above is preserved untouched so existing call sites
// keep working.
// ---------------------------------------------------------------------------

import type {
  GeneratedMarkdowns,
  InterviewPlan,
} from "./gemini-types";

export type { GeneratedMarkdowns, InterviewPlan } from "./gemini-types";

const QUESTION_PLAN_PROMPT = (passion: string) => `
You are the PassionVerse planning interviewer. A user has told us they want to pursue the following:

> I want to achieve — ${passion}.

Your task: write a **Markdown interview plan** that asks the user exactly the right number of questions to build a personalised roadmap for THIS specific pursuit. Pick a count between **3 and 7 inclusive** — more questions when the pursuit is complex or unfamiliar, fewer when it is simple or the user already knows the domain. Never pad with filler.

Each question MUST be a single ordered-list line in this exact shape:

\`\`\`
1. **Label** — The actual question, ending with a question mark?
\`\`\`

The label is a short noun phrase (e.g. "End goal", "Starting point", "Weekly availability", "Budget & owned gear", "Learning style", "Constraints & risks"). The question after the em-dash must be one complete sentence, concrete, and specific to the pursuit — not generic.

Output ONLY a Markdown document in this shape, no preamble, no code fences:

# Interview Plan

A one-sentence framing of why you chose this many questions.

1. **Label** — Question?
2. **Label** — Question?
... (3–7 items total)

Do not answer the questions yourself. Do not include extra bullet lists, tables, or headings beyond "# Interview Plan".
`;

const ROADMAP_PROMPT = (passion: string, qaMarkdown: string) => `
You are the PassionVerse roadmap architect. The user wants to achieve: "${passion}".
They have answered your interview questions as follows:

${qaMarkdown}

Write a complete, practical **roadmap in Markdown** for this specific pursuit and these specific answers. Treat the answers as authoritative constraints — do not invent experience, budget, gear, time, or deadlines.

Required structure (use exactly these headings, in order):

# <Short, specific roadmap title>

> A one-sentence statement of what success looks like.

**Estimated duration:** …
**Estimated budget:** …
**Difficulty:** Beginner | Intermediate | Advanced | Expert

## Overview
2–4 short paragraphs framing the approach.

## Milestones
Ordered list, each item \`**M<n>: <title>** — <one-sentence description, including a target week>.\`. 3–6 milestones.

## Steps
For each step use an H3 heading \`### Step <n>. <title>\`. Under each H3, use exactly these bold inline labels (one per line):
- **Why it matters:** …
- **Estimated time:** …
- **Difficulty:** Beginner | Intermediate | Advanced | Expert
- **Prerequisites:** comma-separated list, or "None"
- **Estimated cost:** …
- **Helpful tips:** bullet list using \`-\`
- **Common mistakes:** bullet list using \`-\`
- **Practice:** bullet list using \`-\`
- **Resources:** bullet list of [Title](https://…) links; if you cannot verify a deep URL, link to a stable home page.

Include at least 3 and at most 8 steps.

## Recommended projects
Ordered list of \`**Title** — <short description, expected outcome>.\`. 2–4 items.

## Success tips
Bullet list of 3–6 tips.

Return ONLY the Markdown document. No code fences. No preamble. No closing remarks.
`;

const TIMETABLE_PROMPT = (passion: string, roadmapTitle: string, startDateIso: string) => `
You are the PassionVerse scheduling assistant. Using the roadmap "${roadmapTitle}" for the pursuit "${passion}", produce a **week-by-week timetable in Markdown** starting from ${startDateIso}.

Rules:
- Cover the first two weeks in daily granularity, then weekly for the rest.
- Each scheduled session line MUST be of the form:
  \`- **<Day name, e.g. Mon>** at **<HH:MM, 24h>** · <duration in minutes> min — <session title>\`
- For weekly rows use:
  \`- **Week <n>** (<Mon date> – <Sun date>) — <weekly focus>\`
- Pick realistic clock times that match a typical learner (e.g. 07:30, 18:00, 20:30). Vary them.
- Keep each session 20–90 minutes.

Output ONLY a Markdown document starting with \`# Timetable\` and containing the lines above. No code fences. No preamble.
`;

/**
 * Generate the Markdown interview plan (3–7 questions) for a given passion.
 * Falls back to a sensible generic plan if Gemini is unavailable or returns
 * an unparseable document.
 */
export async function generateInterviewPlanAI(
  passion: string,
  apiKeyOverride?: string
): Promise<InterviewPlan> {
  const normalized = passion.trim().slice(0, 300);
  if (!normalized) {
    return {
      markdown: "# Interview Plan\n\n1. **Goal** — What exactly do you want to achieve?\n",
      questions: [{ label: "Goal", question: "What exactly do you want to achieve?" }],
    };
  }

  const model = getModel(apiKeyOverride, { temperature: 0.4, maxOutputTokens: 1200 });
  if (model) {
    try {
      const result = await model.generateContent(QUESTION_PLAN_PROMPT(normalized));
      const md = result.response.text().trim();
      const { parseQuestionPlan } = await import("./markdown");
      const questions = parseQuestionPlan(md);
      if (questions.length >= 3 && questions.length <= 7) {
        return { markdown: md, questions };
      }
      console.warn("Gemini question plan had out-of-range length, using fallback.");
    } catch (error) {
      console.warn("Gemini question plan failed; using fallback plan:", error);
    }
  }

  // Fallback generic plan — still Markdown, still valid for the UI.
  const fallbackMarkdown = `# Interview Plan

A short set of questions to shape your ${normalized} roadmap.

1. **End goal** — What concrete result would tell you that you've succeeded at ${normalized}?
2. **Starting point** — What experience do you already have with ${normalized}, and what related skills transfer?
3. **Weekly availability** — How many hours per week can you reliably commit, and do you have a target completion date?
4. **Resources & budget** — What budget, gear, tools, courses, or support do you already have for ${normalized}?
5. **Learning style & obstacles** — How do you learn best, and what challenge is most likely to slow you down?
`;
  const { parseQuestionPlan } = await import("./markdown");
  return {
    markdown: fallbackMarkdown,
    questions: parseQuestionPlan(fallbackMarkdown),
  };
}

/**
 * Derive interactive steps from the roadmap Markdown. Each \`### Step N. Title\`
 * H3 becomes one step. We also harvest bullet lists under known bold labels
 * so the per-step "Ask Mentor" panel still has structured data.
 */
export function parseRoadmapSteps(markdown: string): GeneratedMarkdowns["steps"] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const steps: GeneratedMarkdowns["steps"] = [];

  const flush = (buf: string[]) => {
    if (!buf.length) return null;
    const head = buf[0].match(/^###\s+Step\s+(\d+)\.\s+(.+)$/i);
    if (!head) return null;
    const title = head[2].trim();
    const stepIndex = Number(head[1]);
    const body = buf.slice(1).join("\n");

    const grab = (label: string): string => {
      const m = body.match(new RegExp(`\\*\\*${label}:?\\*\\*\\s*([^\\n]+)`, "i"));
      return m ? m[1].trim() : "";
    };
    const grabList = (label: string): string[] => {
      const m = body.match(new RegExp(`\\*\\*${label}:?\\*\\*\\s*\\n((?:\\s*-\\s*.+\\n?)+)`, "i"));
      if (!m) return [];
      return m[1]
        .split("\n")
        .map((l) => l.replace(/^\s*-\s*/, "").trim())
        .filter(Boolean);
    };
    const grabLinks = (label: string): Array<{ title: string; url: string; type: string }> => {
      const items = grabList(label);
      return items
        .map((it) => {
          const lm = it.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (!lm) return null;
          return { title: lm[1], url: lm[2], type: "Resource" };
        })
        .filter((x): x is { title: string; url: string; type: string } => Boolean(x));
    };

    return {
      id: `step-${stepIndex}`,
      stepIndex,
      title,
      description: "",
      whyItMatters: grab("Why it matters"),
      estimatedTime: grab("Estimated time") || "—",
      difficulty: grab("Difficulty") || "Intermediate",
      prerequisites: grab("Prerequisites")
        ? grab("Prerequisites").split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      estimatedCost: grab("Estimated cost") || "$0",
      helpfulTips: grabList("Helpful tips"),
      commonMistakes: grabList("Common mistakes"),
      onlineResources: grabLinks("Resources"),
      recommendedYouTubeVideos: [],
      officialDocumentation: [],
      practiceExercises: grabList("Practice").map((p, i) => ({
        title: `Practice ${i + 1}`,
        task: p,
        hint: "",
      })),
      completed: false,
    };
  };

  let buf: string[] = [];
  for (const line of lines) {
    if (/^###\s+Step\s+\d+\./.test(line)) {
      const built = flush(buf);
      if (built) steps.push(built);
      buf = [line];
    } else if (buf.length) {
      // A new H1/H2 ends the current step.
      if (/^#{1,2}\s+/.test(line)) {
        const built = flush(buf);
        if (built) steps.push(built);
        buf = [];
      } else {
        buf.push(line);
      }
    }
  }
  const tail = flush(buf);
  if (tail) steps.push(tail);
  return steps;
}

/**
 * Parse the timetable Markdown into notification-ready rows. Each session
 * line of the form \`- **Mon** at **18:30** · 45 min — Title\` becomes one
 * row; weekly rows become rows with time "" and notifyAt null.
 */
export function parseTimetable(
  markdown: string,
  startAt: Date = new Date()
): GeneratedMarkdowns["timetable"] {
  if (!markdown) return [];
  const out: GeneratedMarkdowns["timetable"] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const sessionRe = /^-\s+\*\*([A-Za-z]+)\*\*\s+at\s+\*\*(\d{1,2}:\d{2})\*\*\s*·\s*(\d+)\s*min\s*[—-]\s*(.+)$/;
  const weeklyRe = /^-\s+\*\*Week\s+(\d+)\*\*\s+\(([^)]+)\)\s*[—-]\s*(.+)$/;

  // Anchor each weekday to the next occurrence on or after startAt.
  const anchorFor = (dayName: string): Date => {
    const target = dayNames.indexOf(dayName);
    const d = new Date(startAt);
    const diff = (target - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    let m = line.match(sessionRe);
    if (m) {
      const [, dayName, time, minutes, title] = m;
      const [h, mm] = time.split(":").map((n) => Number(n));
      const anchor = anchorFor(dayName);
      anchor.setHours(h, mm, 0, 0);
      out.push({
        day: dayName,
        time,
        notifyAt: anchor.toISOString(),
        title: title.trim(),
        description: `${minutes}-minute session scheduled for ${dayName} at ${time}.`,
        durationMinutes: Number(minutes),
      });
      continue;
    }
    m = line.match(weeklyRe);
    if (m) {
      out.push({
        day: `Week ${m[1]}`,
        time: "",
        notifyAt: null,
        title: m[3].trim(),
        description: `Week ${m[1]} focus: ${m[2].trim()}.`,
        durationMinutes: 0,
      });
    }
  }
  return out;
}

/**
 * Generate both the roadmap and timetable Markdown for a given bundle of
 * answers, plus the derived interactive steps and timetable rows.
 *
 * The returned \`PresetRoadmap\` carries the raw Markdown strings on its
 * \`roadmapMarkdown\` / \`timetableMarkdown\` fields so they can be rendered
 * directly and persisted as-is to Firestore.
 */
export async function generateRoadmapAndTimetableAI(
  passion: string,
  plan: InterviewPlan,
  answers: string[],
  apiKeyOverride?: string
): Promise<{
  roadmapMarkdown: string;
  timetableMarkdown: string;
  steps: GeneratedMarkdowns["steps"];
  timetable: GeneratedMarkdowns["timetable"];
  roadmapTitle: string;
  roadmapGoal: string;
  roadmapCategory: string;
  estimatedDuration: string;
  estimatedBudget: string;
  difficulty: string;
}> {
  const qaMarkdown = plan.questions
    .map(
      (q, i) => `**Q${i + 1}. ${q.label}** — ${q.question}\n**A${i + 1}.** ${answers[i] ?? ""}\n`
    )
    .join("\n");

  const roadmapModel = getModel(apiKeyOverride, { temperature: 0.35, maxOutputTokens: 8192 });
  let roadmapMarkdown = "";
  if (roadmapModel) {
    try {
      const res = await roadmapModel.generateContent(ROADMAP_PROMPT(passion, qaMarkdown));
      roadmapMarkdown = res.response.text().trim();
    } catch (error) {
      console.warn("Roadmap markdown generation failed; using fallback:", error);
    }
  }
  if (!roadmapMarkdown) {
    roadmapMarkdown = fallbackRoadmapMarkdown(passion, qaMarkdown);
  }

  const titleLine = roadmapMarkdown.match(/^#\s+(.+)$/m);
  const roadmapTitle = titleLine ? titleLine[1].trim() : `Personalized Journey: ${passion}`;
  const goalLine = roadmapMarkdown.match(/^>\s+(.+)$/m);
  const roadmapGoal = goalLine ? goalLine[1].trim() : passion;
  const durationLine = roadmapMarkdown.match(/\*\*Estimated duration:\*\*\s*(.+)$/m);
  const budgetLine = roadmapMarkdown.match(/\*\*Estimated budget:\*\*\s*(.+)$/m);
  const difficultyLine = roadmapMarkdown.match(/\*\*Difficulty:\*\*\s*(.+)$/m);

  const steps = parseRoadmapSteps(roadmapMarkdown);

  // Timetable uses today as the anchor; the FCM hook will reschedule as
  // sessions pass.
  const timetableModel = getModel(apiKeyOverride, { temperature: 0.4, maxOutputTokens: 3000 });
  const startIso = new Date().toISOString().slice(0, 10);
  let timetableMarkdown = "";
  if (timetableModel) {
    try {
      const res = await timetableModel.generateContent(
        TIMETABLE_PROMPT(passion, roadmapTitle, startIso)
      );
      timetableMarkdown = res.response.text().trim();
    } catch (error) {
      console.warn("Timetable markdown generation failed; using fallback:", error);
    }
  }
  if (!timetableMarkdown) {
    timetableMarkdown = fallbackTimetableMarkdown(startIso);
  }
  const timetable = parseTimetable(timetableMarkdown, new Date());

  const category = inferCategory(passion);

  return {
    roadmapMarkdown,
    timetableMarkdown,
    steps,
    timetable,
    roadmapTitle,
    roadmapGoal,
    roadmapCategory: category,
    estimatedDuration: durationLine ? durationLine[1].trim() : "—",
    estimatedBudget: budgetLine ? budgetLine[1].trim() : "—",
    difficulty: difficultyLine ? difficultyLine[1].trim() : "Intermediate",
  };
}

function inferCategory(passion: string): string {
  const p = passion.toLowerCase();
  if (/(code|program|ai|web|app|robot|electron|game|dev)/.test(p)) return "Code & AI";
  if (/(film|photo|video|drone|camera)/.test(p)) return "Film & Photo";
  if (/(music|audio|guitar|piano|sing|podcast)/.test(p)) return "Music & Audio";
  if (/(cook|food|coffee|bake|recipe)/.test(p)) return "Craft & Culinary";
  if (/(run|marathon|fitness|gym|yoga|climb)/.test(p)) return "Fitness & Health";
  if (/(business|startup|market|brand|sell)/.test(p)) return "Business & Startup";
  if (/(language|japan|spanish|french|read|write|speak)/.test(p)) return "Learning";
  return "Personal Project";
}

function fallbackRoadmapMarkdown(passion: string, qa: string): string {
  return `# Personalized Journey: ${passion}

> A focused, four-week plan shaped around your answers.

**Estimated duration:** 4 weeks
**Estimated budget:** Adjust to your stated budget.
**Difficulty:** Intermediate

## Overview

This roadmap is a starting scaffold for **${passion}**. Because the live Gemini call
was unavailable, the steps below are generic placeholders — replace them by
editing this Markdown, or regenerate once a key is configured.

Your interview answers:

${qa}

## Milestones

- **M1: First win** — Complete Step 1 within week 1.
- **M2: Working draft** — Finish Step 2 and 3 by week 2.
- **M3: Polished version** — Ship something by week 4.

## Steps

### Step 1. Foundation
- **Why it matters:** Locks in vocabulary and tooling so later work moves fast.
- **Estimated time:** 3 hours
- **Difficulty:** Beginner
- **Prerequisites:** None
- **Estimated cost:** $0
- **Helpful tips:**
  - Set up your workspace before diving into content.
  - Write down three outcomes you want by the end of this step.
- **Common mistakes:**
  - Skipping setup and hitting avoidable errors later.
- **Practice:**
  - Produce one tiny artifact that proves your setup works.
- **Resources:**
  - [Official docs](https://example.com)

### Step 2. Core loop
- **Why it matters:** Repeating the core loop builds real fluency.
- **Estimated time:** 5 hours
- **Difficulty:** Intermediate
- **Prerequisites:** Step 1
- **Estimated cost:** $0
- **Helpful tips:**
  - Build in 25-minute sprints.
- **Common mistakes:**
  - Switching tutorials mid-step.
- **Practice:**
  - Repeat the core loop three times with variations.
- **Resources:**
  - [Reference](https://example.com)

### Step 3. Polish & share
- **Why it matters:** Sharing forces clarity.
- **Estimated time:** 4 hours
- **Difficulty:** Intermediate
- **Prerequisites:** Step 2
- **Estimated cost:** $0
- **Helpful tips:**
  - Pick one channel and ship there.
- **Common mistakes:**
  - Endless polish before any shipping.
- **Practice:**
  - Publish one artifact and collect one piece of feedback.
- **Resources:**
  - [Showcase guide](https://example.com)

## Recommended projects

- **Mini project** — Apply step 2 to a real problem you care about.
- **Public artifact** — Turn step 3 into something others can use.

## Success tips

- Keep a daily 3-line log.
- Prefer one finished thing over three started things.
- Review progress every Sunday.
`;
}

function fallbackTimetableMarkdown(startIso: string): string {
  return `# Timetable

Starting ${startIso}. Replace with your own schedule by editing the Markdown.

- **Mon** at **18:30** · 45 min — Foundation block 1
- **Tue** at **18:30** · 30 min — Review & notes
- **Wed** at **18:30** · 45 min — Core loop practice
- **Thu** at **07:30** · 20 min — Quick recall
- **Fri** at **18:30** · 60 min — Deep session
- **Sat** at **10:00** · 60 min — Project time
- **Sun** at **20:00** · 15 min — Weekly review
- **Week 2** (Mon–Sun) — Core loop repetitions
- **Week 3** (Mon–Sun) — Polish pass
- **Week 4** (Mon–Sun) — Ship & share
`;
}
