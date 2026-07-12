import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

export interface WeeklyPlanItem {
  weekNumber: number;
  title: string;
  focus: string;
  tasks: string[];
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  targetWeek: number;
  completed: boolean;
}

export interface DailyTaskItem {
  id: string;
  dayNumber: number;
  title: string;
  durationMinutes: number;
  completed: boolean;
}

export interface ShoppingListItem {
  id: string;
  item: string;
  estimatedCost: string;
  priority: "Essential" | "Recommended" | "Optional";
  purchased: boolean;
}

export interface LearningPathItem {
  stage: string;
  description: string;
  resourcesCount: number;
}

export interface RecommendedProjectItem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  expectedOutcome: string;
}

export interface OnlineResourceItem {
  title: string;
  url: string;
  type: string;
}

export interface YouTubeVideoItem {
  title: string;
  url: string;
  channel: string;
  duration: string;
}

export interface OfficialDocItem {
  title: string;
  url: string;
}

export interface PracticeExerciseItem {
  title: string;
  task: string;
  hint: string;
}

export interface RoadmapStepItem {
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
  onlineResources: OnlineResourceItem[];
  recommendedYouTubeVideos: YouTubeVideoItem[];
  officialDocumentation: OfficialDocItem[];
  practiceExercises: PracticeExerciseItem[];
  completed: boolean;
}

export interface CollectedInterviewData {
  passion?: string;
  goal?: string;
  whyPassionate?: string;
  age?: string;
  experience?: string;
  timeCommitment?: string;
  monthlyBudget?: string;
  equipmentOwned?: string;
  learningStyle?: string[];
  deadline?: string;
  pastAttempts?: string;
  challenges?: string;
  motivation?: string;
  additionalNotes?: string;
}

export interface ChatMessageItem {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  adaptedRoadmap?: boolean;
}

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Firebase UID or local UUID
  email: text("email"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roadmapsTable = pgTable("roadmaps", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  goal: text("goal").notNull(),
  category: text("category").default("General"),
  estimatedDuration: text("estimated_duration").notNull(),
  estimatedBudget: text("estimated_budget").notNull(),
  difficulty: text("difficulty").notNull(),
  
  weeklyPlan: jsonb("weekly_plan").$type<WeeklyPlanItem[]>().notNull(),
  milestones: jsonb("milestones").$type<MilestoneItem[]>().notNull(),
  dailyTasks: jsonb("daily_tasks").$type<DailyTaskItem[]>().notNull(),
  shoppingList: jsonb("shopping_list").$type<ShoppingListItem[]>().notNull(),
  learningPath: jsonb("learning_path").$type<LearningPathItem[]>().notNull(),
  recommendedProjects: jsonb("recommended_projects").$type<RecommendedProjectItem[]>().notNull(),
  commonMistakes: jsonb("common_mistakes").$type<string[]>().notNull(),
  successTips: jsonb("success_tips").$type<string[]>().notNull(),
  steps: jsonb("steps").$type<RoadmapStepItem[]>().notNull(),

  progressPercentage: integer("progress_percentage").default(0).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const interviewsTable = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  status: text("status").default("in_progress").notNull(), // 'in_progress' | 'completed'
  messages: jsonb("messages").$type<ChatMessageItem[]>().notNull(),
  collectedData: jsonb("collected_data").$type<CollectedInterviewData>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mentorChatsTable = pgTable("mentor_chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  roadmapId: uuid("roadmap_id").notNull(),
  userId: text("user_id").notNull(),
  messages: jsonb("messages").$type<ChatMessageItem[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
