/**
 * Shared, isomorphic types for the Gemini-backed interview and roadmap
 * pipeline.
 *
 * Kept free of any runtime imports (no `server-only`, no env access) so that
 * client components can `import type { … }` from here without the module
 * graph ever pulling server-only code into the client bundle — which
 * Vercel's stricter server/client boundary checker rejects.
 */

export interface InterviewQuestion {
  id: number;
  label: string;
  question: string;
  whyNeeded: string;
}

export interface InterviewAnswer {
  questionId: number;
  question: string;
  answer: string;
}

export interface InterviewBundle {
  passion: string;
  answers: InterviewAnswer[];
}

/**
 * Gemini returns a Markdown "interview plan" containing a variable number
 * (3–7) of questions. Each entry is rendered 1:1 to the user.
 */
export interface InterviewPlan {
  /** Full Markdown document as produced by Gemini, verbatim. */
  markdown: string;
  /** Parsed questions, in order. Length is 3–7. */
  questions: Array<{ label: string; question: string }>;
}

/**
 * Gemini returns the roadmap and timetable as two independent Markdown
 * documents. The client renders them with <Markdown /> and also keeps the
 * raw text for search + export. A `steps` array is derived from the
 * roadmap's H2 / H3 headings so the interactive step tracker still works.
 */
export interface GeneratedMarkdowns {
  roadmapMarkdown: string;
  timetableMarkdown: string;
  /** Parsed interactive steps derived from the roadmap Markdown. */
  steps: Array<{
    id: string;
    stepIndex: number;
    title: string;
    description: string;
    whyItMatters: string;
    estimatedTime: string;
    difficulty: string;
    prerequisites: string[];
    estimatedCost: string;
    helpfulTips: string[];
    commonMistakes: string[];
    onlineResources: Array<{ title: string; url: string; type: string }>;
    recommendedYouTubeVideos: Array<{ title: string; url: string; channel: string; duration: string }>;
    officialDocumentation: Array<{ title: string; url: string }>;
    practiceExercises: Array<{ title: string; task: string; hint: string }>;
    completed: boolean;
  }>;
  /** Parsed timetable rows used for FCM local notifications. */
  timetable: Array<{
    day: string;
    time: string;
    /** ISO string of the scheduled notification, or null if unschedulable. */
    notifyAt: string | null;
    title: string;
    description: string;
    durationMinutes: number;
  }>;
}
