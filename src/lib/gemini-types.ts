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
  markdownQuestions?: string;
}

export interface PlannedQuestionsResult {
  questions: InterviewQuestion[];
  markdownQuestions: string;
}
