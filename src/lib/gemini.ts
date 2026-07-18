import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RoadmapStepItem } from "@/db/schema";
import type { PresetRoadmap } from "./seed-data";
import { PRESET_ROADMAPS } from "./seed-data";
import type { InterviewBundle, InterviewQuestion } from "./gemini-types";
import { serverKeys } from "@/config/keys.server";

// Re-export types for backward compatibility
export type { InterviewQuestion, InterviewAnswer, InterviewBundle } from "./gemini-types";

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

function fallbackQuestions(passion: string): { questions: InterviewQuestion[]; markdownQuestions: string } {
  const subject = passion.trim() || "this passion";
  const questionsList = [
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

  const markdownQuestions = `### Interview Questions for: ${subject}\n\n` +
    questionsList.map((q) => `**${q.id}. [${q.label}]** ${q.question} *(Why needed: ${q.whyNeeded})*`).join("\n\n");

  return { questions: questionsList, markdownQuestions };
}

export async function generateInterviewQuestionsAI(
  passion: string,
  apiKeyOverride?: string
): Promise<{ questions: InterviewQuestion[]; markdownQuestions: string }> {
  const normalizedPassion = passion.trim().slice(0, 300);
  if (!normalizedPassion) return fallbackQuestions("this passion");

  const model = getModel(apiKeyOverride, {
    responseMimeType: "application/json",
    temperature: 0.35,
    maxOutputTokens: 2000,
  });

  if (model) {
    try {
      const prompt = `
You are the planning interviewer for PassionVerse.
The user wants to pursue a passion or goal. 
The exact user statement is: "I want to achieve - ${normalizedPassion}".

Analyze this target, and generate EXACTLY between 3 and 7 highly personalized, subject-specific questions needed to build a safe, practical roadmap.
Do not output generic template questions. Design specific, relevant questions for this actual goal.
For example, if they want to make an Otto robot, ask specifically about Arduino experience, servo motors, available 3D printer access, and motion scripting.

Also write a beautiful, clear Markdown description of these questions to serve as an overview.

Return STRICT JSON only matching this exact schema:
{
  "questions": [
    { "id": 1, "label": "Short label (e.g. Goal, Coding, Equipment)", "question": "The actual full question to ask", "whyNeeded": "Why we need this answer" }
  ],
  "markdownQuestions": "A beautiful Markdown string containing all generated questions in a clean listed format"
}`;

      const result = await model.generateContent(prompt);
      const parsed = parseJsonLenient<{ questions?: InterviewQuestion[]; markdownQuestions?: string }>(
        result.response.text()
      );
      
      if (
        Array.isArray(parsed.questions) &&
        parsed.questions.length >= 3 &&
        parsed.questions.length <= 7 &&
        parsed.questions.every((q) => Boolean(q?.question?.trim()))
      ) {
        const cleanedQs = parsed.questions.map((q, index) => ({
          id: index + 1,
          label: q.label || `Question ${index + 1}`,
          question: q.question.trim(),
          whyNeeded: q.whyNeeded || "Used to personalize your roadmap.",
        }));

        const mdQuestions = parsed.markdownQuestions || 
          `### Personalized Interview Questions\n\n` + cleanedQs.map((q) => `**${q.id}. [${q.label}]** ${q.question}\n*Why we ask:* ${q.whyNeeded}`).join("\n\n");

        return { questions: cleanedQs, markdownQuestions: mdQuestions };
      }
      console.warn("Gemini returned invalid questions range; using fallback questions.");
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
    temperature: 0.4,
    maxOutputTokens: 8192,
  });

  if (model) {
    try {
      const prompt = `
You are the roadmap architect for PassionVerse.
The user wants to pursue this passion: "I want to achieve - ${collectedData.passion}".
Here are their answers to the personalized planning interview:
${JSON.stringify(collectedData.answers, null, 2)}

Build one coherent, highly personalized, practical roadmap specifically for this passion and these answers.
You must output BOTH a structured JSON format (for interactive toggling) AND beautiful, detailed Markdown blocks.

Specific deliverables:
1. "markdownRoadmap": A complete, gorgeous, comprehensive guide to mastering this passion in Markdown format, incorporating resources, steps, milestone metrics, and common mistakes.
2. "markdownTimetable": A detailed schedule/timetable in Markdown format, structured as a clean timetable list or table. This will also be used to trigger future notifications, so list clear timing checkpoints.
3. High quality structured fields (title, goal, category, estimatedDuration, estimatedBudget, difficulty, weeklyPlan, milestones, dailyTasks, shoppingList, steps) matching the JSON scheme perfectly.

Return STRICT JSON only, matching this exact schema:
{
  "title": "Clear, inspiring title",
  "goal": "Specific concrete goal summarizing their desired outcome",
  "category": "One of: Code & AI, Film & Photo, Music & Audio, Craft & Culinary, Gaming & Design, Business & Startup, Fitness & Health, General",
  "estimatedDuration": "e.g. '10 Weeks' or '6 Months'",
  "estimatedBudget": "e.g. '$150 total' or '$0 (Free tier tools)'",
  "difficulty": "One of: Beginner, Intermediate, Advanced, Expert",
  "markdownRoadmap": "Detailed roadmap in Markdown format",
  "markdownTimetable": "Detailed timetable/schedule in Markdown format",
  "weeklyPlan": [
    { "weekNumber": 1, "title": "...", "focus": "...", "tasks": ["task 1", "task 2"] }
  ],
  "milestones": [
    { "id": "m-1", "title": "First Milestone", "description": "...", "targetWeek": 2, "completed": false }
  ],
  "dailyTasks": [
    { "id": "dt-1", "dayNumber": 1, "title": "...", "durationMinutes": 30, "completed": false }
  ],
  "shoppingList": [
    { "id": "sl-1", "item": "...", "estimatedCost": "$20", "priority": "Essential", "purchased": false }
  ],
  "learningPath": [
    { "stage": "Stage 1", "description": "...", "resourcesCount": 5 }
  ],
  "recommendedProjects": [
    { "id": "rp-1", "title": "...", "description": "...", "difficulty": "Intermediate", "expectedOutcome": "..." }
  ],
  "commonMistakes": [
    "Mistake and how to avoid it"
  ],
  "successTips": [
    "Tip for daily consistency"
  ],
  "steps": [
    {
      "id": "step-1",
      "stepIndex": 1,
      "title": "Foundation Setup",
      "description": "Step description",
      "whyItMatters": "Why this matters",
      "estimatedTime": "4 hours",
      "difficulty": "Beginner",
      "prerequisites": ["Prereq 1"],
      "estimatedCost": "$0",
      "helpfulTips": ["Tip 1"],
      "commonMistakes": ["Mistake 1"],
      "onlineResources": [{ "title": "Resource", "url": "https://example.com", "type": "Docs" }],
      "recommendedYouTubeVideos": [{ "title": "Video", "url": "https://youtube.com", "channel": "Channel", "duration": "10:00" }],
      "officialDocumentation": [{ "title": "Docs", "url": "https://example.com" }],
      "practiceExercises": [{ "title": "Exercise", "task": "Task detail", "hint": "Hint info" }],
      "completed": false
    }
  ]
}`;

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

  const generatedMarkdownRoadmap = `
# Roadmap: Mastering ${collectedData.passion}

## Goal
${answer(1) || `Build practical mastery in ${collectedData.passion}.`}

## Schedule & Progress Overview
- **Duration:** ${answer(3) || basePreset.estimatedDuration}
- **Allocated Budget:** ${answer(4) || basePreset.estimatedBudget}

## Phases of Progress
1. **Phase 1: Getting Started & Foundations**
2. **Phase 2: Project Architecture & Execution**
3. **Phase 3: Refinement, Polish & Publishing**
`;

  const generatedMarkdownTimetable = `
| Stage | Target Milestone | Commitment | Recommended Focus |
|---|---|---|---|
| Week 1-2 | Basic setup & initial testing | 4-6 hours | Focus on core configuration |
| Week 3-4 | Mid-point project iteration | 6-8 hours | Assemble structural layouts |
| Week 5-6 | Polish, debugging, and wrap-up | 5 hours | Complete capstone project |
`;

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
    markdownRoadmap: generatedMarkdownRoadmap,
    markdownTimetable: generatedMarkdownTimetable,
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

  const defaultMarkdownRoadmap = `
# Roadmap: Mastering ${collectedData.passion}

## Goal
${parsed.goal || answer(1) || `Follow your passion for ${collectedData.passion}.`}

## Progress Path & Milestone Sprints
${milestones.map((m) => `- **Week ${m.targetWeek}:** ${m.title} — *${m.description}*`).join("\n")}
`;

  const defaultMarkdownTimetable = `
### Program Timetable Schedule

| Milestone Period | Target Goal | Recommended Duration |
|---|---|---|
${weeklyPlan.map((wp) => `| Week ${wp.weekNumber} | ${wp.title} | ${wp.focus} |`).join("\n")}
`;

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
    markdownRoadmap: parsed.markdownRoadmap || defaultMarkdownRoadmap,
    markdownTimetable: parsed.markdownTimetable || defaultMarkdownTimetable,
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
      console.warn("Gemini mentor reply had no \`reply\` field; using fallback mentor logic.");
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
    reply: `Here's how I'd approach that for **${roadmap.title}**:\n\n1. Anchor to one concrete outcome for today — something you can finish in one sitting.\n2. Use the official documentation link on the active step for the canonical answer, not a random borough post.\n3. When in doubt, do the smallest possible version first, then iterate.\n\nShare a bit more about where you're stuck (a step number, an error, or a decision you're weighing) and I'll get specific.`,
  };
}
