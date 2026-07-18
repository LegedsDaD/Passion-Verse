import type {
  WeeklyPlanItem,
  MilestoneItem,
  DailyTaskItem,
  ShoppingListItem,
  LearningPathItem,
  RecommendedProjectItem,
  RoadmapStepItem,
} from "@/db/schema";

export interface PresetRoadmap {
  id: string;
  title: string;
  goal: string;
  category: string;
  estimatedDuration: string;
  estimatedBudget: string;
  difficulty: string;
  progressPercentage: number;
  isFavorite: boolean;
  isPublic: boolean;
  weeklyPlan: WeeklyPlanItem[];
  milestones: MilestoneItem[];
  dailyTasks: DailyTaskItem[];
  shoppingList: ShoppingListItem[];
  learningPath: LearningPathItem[];
  recommendedProjects: RecommendedProjectItem[];
  commonMistakes: string[];
  successTips: string[];
  steps: RoadmapStepItem[];
  createdAt: string;
  markdownRoadmap?: string;
  markdownTimetable?: string;
  markdownQuestions?: string;
}

const _PRESET_ROADMAPS_RAW: PresetRoadmap[] = [
  {
    id: "roadmap-ai-engineer-101",
    title: "Full-Stack AI & Agentic Systems Mastery",
    goal: "Architect, build, and deploy production-grade autonomous AI agents and fullstack web apps using Next.js 15, TypeScript, PostgreSQL, and Google Gemini.",
    category: "Code & AI",
    estimatedDuration: "12 Weeks",
    estimatedBudget: "$120 (API credits & hosting)",
    difficulty: "Advanced",
    progressPercentage: 45,
    isFavorite: true,
    isPublic: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    weeklyPlan: [
      {
        weekNumber: 1,
        title: "Modern Next.js 15 App Router & Server Actions",
        focus: "Master React Server Components, Drizzle ORM with PostgreSQL, and strict TypeScript types.",
        tasks: [
          "Setup Next.js 15 project with Tailwind CSS v4 and Drizzle ORM",
          "Design scalable schema for multi-tenant SaaS application",
          "Build type-safe Server Actions and optimistic updates",
        ],
      },
      {
        weekNumber: 2,
        title: "Google Gemini AI Integration & Prompt Architecture",
        focus: "Connect Google GenAI SDK, design structured JSON schemas, and implement function calling.",
        tasks: [
          "Implement streaming completions with Gemini 2.5 Flash",
          "Create structured JSON outputs using response_schema",
          "Build adaptive prompt templates with system instructions",
        ],
      },
      {
        weekNumber: 3,
        title: "Autonomous Agent Tool Calling & Memory",
        focus: "Build agents that can read databases, fetch web pages, and maintain multi-turn memory.",
        tasks: [
          "Implement recursive tool evaluation loops",
          "Store conversation history and embeddings in PostgreSQL",
          "Design safety guards and rate limiting for API protection",
        ],
      },
      {
        weekNumber: 4,
        title: "Production Hardening, Caching & Observability",
        focus: "Add rate limiting, response caching, structured logging, and a production-grade deploy pipeline.",
        tasks: [
          "Add server-side caching for repeated structured Gemini calls",
          "Implement per-user rate limits and clear error envelopes",
          "Wire structured logs and basic latency metrics on every server action",
        ],
      },
    ],
    milestones: [
      {
        id: "m-1",
        title: "First Type-Safe AI Server Action",
        description: "Successfully invoke Gemini API from a Next.js Server Action with strict schema validation.",
        targetWeek: 1,
        completed: true,
      },
      {
        id: "m-2",
        title: "Autonomous Tool Executing Agent",
        description: "Agent can autonomously decide which database or web search tools to execute based on user intent.",
        targetWeek: 3,
        completed: true,
      },
      {
        id: "m-3",
        title: "Production-Grade Caching & Rate Limits",
        description: "Repeated identical prompts are served from cache, and abusive clients are throttled with a clear retry-after header.",
        targetWeek: 4,
        completed: false,
      },
      {
        id: "m-4",
        title: "Production Vercel Deployment & Showcase",
        description: "Launch full app with custom domain, PostgreSQL connection pooling, and 99.9% uptime.",
        targetWeek: 12,
        completed: false,
      },
    ],
    dailyTasks: [
      { id: "dt-1", dayNumber: 1, title: "Review TypeScript strict mode compiler options", durationMinutes: 30, completed: true },
      { id: "dt-2", dayNumber: 2, title: "Write Drizzle migrations for users and roadmaps", durationMinutes: 45, completed: true },
      { id: "dt-3", dayNumber: 3, title: "Test Gemini streaming tokens with readable stream", durationMinutes: 60, completed: true },
      { id: "dt-4", dayNumber: 4, title: "Create glassmorphic UI cards with Framer Motion", durationMinutes: 50, completed: false },
      { id: "dt-5", dayNumber: 5, title: "Audit API route security & add rate limiting headers", durationMinutes: 40, completed: false },
    ],
    shoppingList: [
      { id: "sl-1", item: "Google Cloud / Gemini API Pay-As-You-Go Tier", estimatedCost: "$20/mo", priority: "Essential", purchased: true },
      { id: "sl-2", item: "PostHog or Sentry Free Tier (analytics & error tracking)", estimatedCost: "$0 (Free tier)", priority: "Recommended", purchased: true },
      { id: "sl-3", item: "Vercel Pro (Optional for custom domains & extended timeouts)", estimatedCost: "$20/mo", priority: "Optional", purchased: false },
      { id: "sl-4", item: "PostgreSQL Database (Supabase / Neon / Local Docked)", estimatedCost: "$0 (Free tier)", priority: "Essential", purchased: true },
    ],
    learningPath: [
      { stage: "Stage 1: Fundamentals", description: "Modern TypeScript v5, Next.js App Router, and Drizzle ORM queries.", resourcesCount: 6 },
      { stage: "Stage 2: AI Engineering", description: "LLM parameters, temperature, tokenization, embeddings, and structured outputs.", resourcesCount: 8 },
      { stage: "Stage 3: Advanced Agents", description: "ReAct pattern, tool evaluation, memory state machines, and system orchestration.", resourcesCount: 5 },
    ],
    recommendedProjects: [
      {
        id: "rp-1",
        title: "AI Research Assistant with Web Citation",
        description: "An app that takes a research query, queries 3 web sources, synthesizes answers with Gemini, and cites links.",
        difficulty: "Intermediate",
        expectedOutcome: "Deep understanding of tool calling and structured markdown output.",
      },
      {
        id: "rp-2",
        title: "Structured Output Playground",
        description: "A small tool that takes a JSON schema, prompts Gemini with strict structured output, and renders a live diff between the schema and the model's response.",
        difficulty: "Advanced",
        expectedOutcome: "Fluency with typed AI responses, schema validation, and defensive parsing.",
      },
    ],
    commonMistakes: [
      "Exposing API keys inside client-side components (`use client`) instead of server routes.",
      "Not using strict structured JSON schemas (`responseSchema`) leading to parsing failures.",
      "Sending too many tokens in context history without pruning or summarization.",
      "Forgetting optimistic UI updates when users check off tasks or milestones.",
    ],
    successTips: [
      "Always test prompts in Google AI Studio before copying them into code.",
      "Use `drizzle-kit push` for rapid prototyping during early schema iteration.",
      "Cache invariant AI responses (like static resource explanations) to save credits.",
      "Incorporate loading skeletons so the user feels immediate responsiveness.",
    ],
    steps: [
      {
        id: "step-1",
        stepIndex: 1,
        title: "Initialize Next.js 15 & Drizzle ORM Setup",
        description: "Set up the modern app architecture with Server Actions, Tailwind CSS, and Drizzle PostgreSQL database client.",
        whyItMatters: "A clean, type-safe foundation prevents technical debt and ensures fast build times across frontend and backend.",
        estimatedTime: "3 hours",
        difficulty: "Intermediate",
        prerequisites: ["Node.js v20+", "Basic React knowledge", "SQL fundamentals"],
        estimatedCost: "$0",
        helpfulTips: [
          "Use connection pooling (`pg.Pool`) to avoid exhausting database connections.",
          "Keep database schema exports in one single clean file (`src/db/schema.ts`).",
        ],
        commonMistakes: [
          "Not setting up environment variables (`DATABASE_URL`) before running migrations.",
          "Confusing `drizzle-orm/postgres-js` with `drizzle-orm/node-postgres` drivers.",
        ],
        onlineResources: [
          { title: "Next.js App Router Documentation", url: "https://nextjs.org/docs", type: "Docs" },
          { title: "Drizzle ORM PostgreSQL Guide", url: "https://orm.drizzle.team/docs/get-started-postgresql", type: "Guide" },
        ],
        recommendedYouTubeVideos: [
          { title: "Next.js 15 Full Course - Server Actions & Drizzle", url: "https://www.youtube.com/watch?v=wm5gMKuwSYk", channel: "Fireship", duration: "18:42" },
          { title: "Why Drizzle ORM is replacing Prisma in 2026", url: "https://www.youtube.com/watch?v=7-1eBqN81fE", channel: "Theo - t3.gg", duration: "14:15" },
        ],
        officialDocumentation: [
          { title: "Next.js 15 Release Notes", url: "https://nextjs.org/blog/next-15" },
          { title: "PostgreSQL Official Documentation", url: "https://www.postgresql.org/docs/" },
        ],
        practiceExercises: [
          {
            title: "Create a User Profile Table",
            task: "Define a Drizzle table with id, email, bio, and updatedAt timestamp, then push to database.",
            hint: "Use `pgTable`, `text`, and `timestamp` from `drizzle-orm/pg-core`.",
          },
        ],
        completed: true,
      },
      {
        id: "step-2",
        stepIndex: 2,
        title: "Integrate Google Gemini API for Structured JSON",
        description: "Configure `@google/generative-ai` to generate deterministic JSON outputs for roadmaps, daily plans, and adaptive advice.",
        whyItMatters: "Structured JSON guarantees your frontend components can render dynamic AI content without regex errors or broken UI cards.",
        estimatedTime: "4 hours",
        difficulty: "Advanced",
        prerequisites: ["Completed Step 1", "Google AI Studio API Key"],
        estimatedCost: "Free tier ($0)",
        helpfulTips: [
          "Set `generationConfig: { responseMimeType: 'application/json' }` whenever expecting JSON.",
          "Always wrap JSON parsing in `try / catch` blocks with fallback handling.",
        ],
        commonMistakes: [
          "Asking the AI to output markdown backticks when `responseMimeType: 'application/json'` is enabled.",
          "Exposing `GEMINI_API_KEY` to the browser bundle instead of reading from `process.env` on the server.",
        ],
        onlineResources: [
          { title: "Google GenAI Quickstart for Node.js", url: "https://ai.google.dev/gemini-api/docs/quickstart?lang=node", type: "Docs" },
          { title: "Structured Outputs with Gemini", url: "https://ai.google.dev/gemini-api/docs/structured-output", type: "Guide" },
        ],
        recommendedYouTubeVideos: [
          { title: "Build AI Agents with Google Gemini 2.0 Flash", url: "https://www.youtube.com/watch?v=Ue7vLP4_zT0", channel: "CodeWithAntonio", duration: "24:10" },
        ],
        officialDocumentation: [
          { title: "Google AI Studio API Reference", url: "https://ai.google.dev/api" },
        ],
        practiceExercises: [
          {
            title: "Build a Meal Plan Generator API",
            task: "Write an API route `/api/test-gemini` that accepts a target calorie count and returns JSON with breakfast, lunch, and dinner.",
            hint: "Define the TypeScript type and prompt Gemini with the exact keys required.",
          },
        ],
        completed: true,
      },
      {
        id: "step-3",
        stepIndex: 3,
        title: "Edge Caching, Rate Limiting & Cost Controls",
        description: "Add per-user rate limits, short-lived caches for repeated structured prompts, and a clear error envelope so the UI can surface retry guidance.",
        whyItMatters: "Without these, a single enthusiastic user can blow through API credits in minutes and the app looks flaky under load.",
        estimatedTime: "3 hours",
        difficulty: "Intermediate",
        prerequisites: ["Step 1 & 2 completed", "A deployed preview environment on Vercel"],
        estimatedCost: "$0",
        helpfulTips: [
          "Key the cache on a hash of (model, prompt, schemaVersion) so schema changes invalidate cleanly.",
          "Return a stable error shape ({code, message, retryAfterMs}) from every server action so the client UI stays simple.",
        ],
        commonMistakes: [
          "Caching the raw string response instead of the parsed object, which forces re-parsing on every hit.",
          "Rate-limiting by IP on a shared NAT — use the signed-in user ID once you have it.",
        ],
        onlineResources: [
          { title: "Next.js Caching Guide", url: "https://nextjs.org/docs/app/building-your-application/caching", type: "Docs" },
        ],
        recommendedYouTubeVideos: [
          { title: "Rate Limiting in Next.js App Router", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", channel: "Theo - t3.gg", duration: "12:48" },
        ],
        officialDocumentation: [
          { title: "Vercel Edge Runtime Reference", url: "https://vercel.com/docs/functions/runtimes/edge-runtime" },
        ],
        practiceExercises: [
          {
            title: "Wrap a Gemini Call in a 60-Second Cache",
            task: "Take the existing structured-output call and cache its parsed result for 60 seconds keyed by a sha256 of the prompt.",
            hint: "A simple in-memory Map with an expiry timestamp is fine for this exercise.",
          },
        ],
        completed: false,
      },
    ],
  },
  {
    id: "roadmap-cinematic-fpv-201",
    title: "Cinematic Drone FPV Filmmaking & Aerial Grading",
    goal: "Master manual FPV drone flying, color grading in DaVinci Resolve, and aerial composition to produce stunning commercial films.",
    category: "Film & Photo",
    estimatedDuration: "8 Weeks",
    estimatedBudget: "$450 (Simulator + Radio + Cinewhoop)",
    difficulty: "Intermediate",
    progressPercentage: 70,
    isFavorite: false,
    isPublic: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    weeklyPlan: [
      {
        weekNumber: 1,
        title: "Radio Controller Setup & Simulator Muscle Memory",
        focus: "Acquire a hobby-grade radio transmitter and log 20 hours in Liftoff/Velocidrone simulator.",
        tasks: [
          "Configure Radiomaster Pocket/Boxer controller over USB",
          "Practice acro mode throttle management through tight gaps",
          "Master coordinated turns using yaw and roll simultaneous stick inputs",
        ],
      },
      {
        weekNumber: 2,
        title: "Micro Cinewhoop Flight & Safety Protocols",
        focus: "Transition from simulator to a sub-250g protected prop drone for indoor and close-proximity flying.",
        tasks: [
          "Configure Betaflight failsafe and OSD elements",
          "Execute smooth orbits around focal subjects at chest height",
          "Learn LiPo battery safety, storage voltage, and charging habits",
        ],
      },
    ],
    milestones: [
      { id: "fpv-m1", title: "10 Straight Hours of Crash-Free Simulator Flight", description: "Complete Liftoff intermediate tracks without resetting.", targetWeek: 1, completed: true },
      { id: "fpv-m2", title: "First 4K Smooth One-Take Real Estate Walkthrough", description: "Capture a seamless indoor-to-outdoor continuous shot.", targetWeek: 4, completed: true },
    ],
    dailyTasks: [
      { id: "fpv-dt1", dayNumber: 1, title: "30 minutes of acro simulator gap drills", durationMinutes: 30, completed: true },
      { id: "fpv-dt2", dayNumber: 2, title: "Study ND filter shutter speed rules (180 degree rule)", durationMinutes: 20, completed: true },
    ],
    shoppingList: [
      { id: "fpv-sl1", item: "Radiomaster Pocket ELRS Radio Controller", estimatedCost: "$65", priority: "Essential", purchased: true },
      { id: "fpv-sl2", item: "Liftoff FPV Drone Simulator (Steam)", estimatedCost: "$20", priority: "Essential", purchased: true },
      { id: "fpv-sl3", item: "BetaFPV Pavo20 Cinewhoop + DJI O3 Air Unit", estimatedCost: "$320", priority: "Recommended", purchased: false },
    ],
    learningPath: [
      { stage: "Simulators", description: "Building muscle memory before risking hardware.", resourcesCount: 4 },
      { stage: "Cinewhoop", description: "Close proximity protected flying with high resolution action cameras.", resourcesCount: 6 },
    ],
    recommendedProjects: [
      { id: "fpv-rp1", title: "Automotive Chase Showcase Reel", description: "Film a slow-moving sports car with cinematic low-angle tracking shots.", difficulty: "Intermediate", expectedOutcome: "Smooth throttle control and cinematic proximity." },
    ],
    commonMistakes: [
      "Flying in Angle/Horizon mode instead of jumping straight to Acro mode in the simulator.",
      "Forgetting to use ND filters in bright sunlight, resulting in jittery high shutter speed video.",
    ],
    successTips: [
      "Keep your camera tilt between 10 to 15 degrees when filming slow cinematic shots.",
      "Always scout your flight path on foot before launching the drone.",
    ],
    steps: [
      {
        id: "fpv-step-1",
        stepIndex: 1,
        title: "Master Simulator Acro Flight Control",
        description: "Connect your ELRS transmitter to Liftoff/Velocidrone on PC/Mac and learn Acro mode physics.",
        whyItMatters: "Crashing in the simulator is free ($0). Crashing a real carbon-fiber drone costs hundreds of dollars.",
        estimatedTime: "20 hours total practice",
        difficulty: "Beginner",
        prerequisites: ["Computer with USB port", "ELRS Radio Controller"],
        estimatedCost: "$85 ($65 radio + $20 sim)",
        helpfulTips: ["Set simulator gravity and drag to realistic values.", "Practice flying figure-8s around two trees until effortless."],
        commonMistakes: ["Giving up after the first hour of disorientation."],
        onlineResources: [{ title: "Liftoff Official Guide", url: "https://www.liftoff-game.com", type: "Sim" }],
        recommendedYouTubeVideos: [{ title: "How to Fly FPV Drone in Acro Mode for Beginners", url: "https://www.youtube.com/watch?v=6P6v6v6v", channel: "Joshua Bardwell", duration: "28:10" }],
        officialDocumentation: [{ title: "Betaflight Configurator Reference", url: "https://betaflight.com" }],
        practiceExercises: [{ title: "The Figure-8 Challenge", task: "Complete 10 clean figure-8 loops around two pillars without touching walls.", hint: "Coordinate roll and yaw together." }],
        completed: true,
      },
    ],
  },
  {
    id: "roadmap-coffee-roasting",
    title: "Artisanal Specialty Coffee Roasting & Espresso Mastery",
    goal: "Sourced specialty green beans, master drum roast profiling, and dial-in 9-bar espresso extraction with perfect latte art.",
    category: "Craft & Culinary",
    estimatedDuration: "6 Weeks",
    estimatedBudget: "$280 (Sample roaster, scale, green coffee beans)",
    difficulty: "Beginner",
    progressPercentage: 20,
    isFavorite: false,
    isPublic: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    weeklyPlan: [
      { weekNumber: 1, title: "Green Coffee Botany & Processing Methods", focus: "Understand Washed, Natural, and Honey processed origins and moisture content.", tasks: ["Sample cup 3 single-origin coffees side-by-side", "Learn bean density classification and defect sorting"] },
    ],
    milestones: [
      { id: "cof-m1", title: "First Consistent City+ Roast Profile", description: "Successfully hit First Crack at 9:00 with a 15% development time ratio.", targetWeek: 2, completed: true },
    ],
    dailyTasks: [
      { id: "cof-dt1", dayNumber: 1, title: "Calibrate burr grinder with 0.1g precision scale", durationMinutes: 15, completed: true },
    ],
    shoppingList: [
      { id: "cof-sl1", item: "Ethiopian Yirgacheffe & Colombian Green Beans (5 lbs)", estimatedCost: "$45", priority: "Essential", purchased: true },
    ],
    learningPath: [{ stage: "Origin & Roasting", description: "Thermal transfer, Maillard reaction, and bean chemistry.", resourcesCount: 5 }],
    recommendedProjects: [{ id: "cof-rp1", title: "Blind Cupping Tasting Flight for Friends", description: "Host a sensory tasting experience with aroma and acidity evaluation sheets.", difficulty: "Beginner", expectedOutcome: "Trained palate recognition." }],
    commonMistakes: ["Baking the coffee by dropping temperature during first crack."],
    successTips: ["Always let freshly roasted beans rest 5-7 days before espresso extraction for CO2 degassing."],
    steps: [
      {
        id: "cof-step-1",
        stepIndex: 1,
        title: "Understanding Roast Curves & Rate of Rise (RoR)",
        description: "Log bean temperature over time and track the Maillard reaction stage.",
        whyItMatters: "Roasting is heat transfer science; controlling RoR unlocks sweetness and floral aromatics.",
        estimatedTime: "4 hours",
        difficulty: "Beginner",
        prerequisites: ["Thermometer or data logger"],
        estimatedCost: "$30",
        helpfulTips: ["Keep RoR steadily declining; never let it crash or flick."],
        commonMistakes: ["Using excessive heat at the very end of the roast."],
        onlineResources: [{ title: "Artisan Roaster Scope Software", url: "https://artisan-scope.org", type: "Software" }],
        recommendedYouTubeVideos: [{ title: "Coffee Roasting Fundamentals with James Hoffmann", url: "https://www.youtube.com/watch?v=abc123xyz", channel: "James Hoffmann", duration: "19:14" }],
        officialDocumentation: [{ title: "SCA Cupping Protocols", url: "https://sca.coffee" }],
        practiceExercises: [{ title: "Log Your First 3 Sample Batches", task: "Record charge temp, turning point, first crack time, and drop temp.", hint: "Use a simple spreadsheet or Artisan software." }],
        completed: false,
      },
    ],
  },
  {
    id: "roadmap-indie-game-godot",
    title: "Indie Game Development with Godot 4 & C#",
    goal: "Design, code, polish, and publish a compelling 2D pixel-art metroidvania or action roguelite to Steam.",
    category: "Gaming & Design",
    estimatedDuration: "16 Weeks",
    estimatedBudget: "$0 (Open Source Engine)",
    difficulty: "Advanced",
    progressPercentage: 85,
    isFavorite: true,
    isPublic: true,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    weeklyPlan: [
      { weekNumber: 1, title: "Godot 4 Node Hierarchy & Signals", focus: "Master Scenes, Nodes, Signals, and PhysicsBody2D mechanics.", tasks: ["Build player character controller with coyote time and jump buffering", "Setup tilemaps and collision layers"] },
    ],
    milestones: [
      { id: "game-m1", title: "Playable Core Combat Prototype", description: "Enemies with state machines, hitboxes, screen shake, and floating damage numbers.", targetWeek: 4, completed: true },
    ],
    dailyTasks: [
      { id: "game-dt1", dayNumber: 1, title: "Refactor enemy AI state machine to use Node-based states", durationMinutes: 45, completed: true },
    ],
    shoppingList: [
      { id: "game-sl1", item: "Godot 4 Game Engine", estimatedCost: "$0 (Free / Open Source)", priority: "Essential", purchased: true },
      { id: "game-sl2", item: "Aseprite Pixel Art Tool", estimatedCost: "$20", priority: "Recommended", purchased: true },
    ],
    learningPath: [{ stage: "Game Architecture", description: "Signals, state machines, and resource saving.", resourcesCount: 7 }],
    recommendedProjects: [{ id: "game-rp1", title: "10-Minute High Score Survival Arena", description: "Create a self-contained arcade game with wave spawning and leaderboards.", difficulty: "Intermediate", expectedOutcome: "Complete game loop mastery." }],
    commonMistakes: ["Trying to build an open-world MMORPG as your very first solo project."],
    successTips: ["Add juice early: subtle particle effects, screen shake, and crisp sound design make simple shapes feel amazing."],
    steps: [
      {
        id: "game-step-1",
        stepIndex: 1,
        title: "Player Controller Juice & Responsiveness",
        description: "Implement coyote time, jump buffering, variable jump height, and dust particles.",
        whyItMatters: "Movement is 80% of how a game feels. If jumping feels stiff, players quit within 60 seconds.",
        estimatedTime: "5 hours",
        difficulty: "Intermediate",
        prerequisites: ["Godot 4 installed", "Basic C# or GDScript"],
        estimatedCost: "$0",
        helpfulTips: ["Coyote time = give the player 100ms of grace jump after walking off a ledge."],
        commonMistakes: ["Using raw input delta time without clamping velocity."],
        onlineResources: [{ title: "Godot 4 Physics Documentation", url: "https://docs.godotengine.org", type: "Docs" }],
        recommendedYouTubeVideos: [{ title: "Why Your Jump Feels Bad in Games", url: "https://www.youtube.com/watch?v=xyz789", channel: "GMTK", duration: "15:20" }],
        officialDocumentation: [{ title: "Godot CharacterBody2D Reference", url: "https://docs.godotengine.org/en/stable/classes/class_characterbody2d.html" }],
        practiceExercises: [{ title: "Implement Jump Buffering", task: "Store jump keypresses 150ms before landing so the player instantly jumps upon touching the ground.", hint: "Use a timer or countdown float variable." }],
        completed: true,
      },
    ],
  },
];

/**
 * Reset all example roadmaps to 0% progress on first load so users get a
 * fresh, uncompleted template regardless of how the seed data was authored.
 */
function resetRoadmapProgress(r: PresetRoadmap): PresetRoadmap {
  return {
    ...r,
    progressPercentage: 0,
    isFavorite: false,
    steps: r.steps.map((s) => ({ ...s, completed: false })),
    milestones: r.milestones.map((m) => ({ ...m, completed: false })),
    dailyTasks: r.dailyTasks.map((t) => ({ ...t, completed: false })),
    shoppingList: r.shoppingList.map((s) => ({ ...s, purchased: false })),
  };
}

export const PRESET_ROADMAPS: PresetRoadmap[] =
  _PRESET_ROADMAPS_RAW.map(resetRoadmapProgress);
