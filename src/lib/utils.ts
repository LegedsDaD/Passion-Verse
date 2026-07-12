import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  if (typeof amount === "string") return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDifficultyColor(difficulty: string): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  const diff = difficulty.toLowerCase();
  if (diff.includes("beginner") || diff.includes("easy")) {
    return {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/30",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    };
  }
  if (diff.includes("intermediate") || diff.includes("medium")) {
    return {
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    };
  }
  if (diff.includes("advanced") || diff.includes("hard")) {
    return {
      bg: "bg-purple-500/10 dark:bg-purple-500/15",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/30",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    };
  }
  return {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
  };
}

export function getCategoryIcon(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes("code") || cat.includes("tech") || cat.includes("ai") || cat.includes("software")) return "Code2";
  if (cat.includes("music") || cat.includes("audio") || cat.includes("sound")) return "Music";
  if (cat.includes("film") || cat.includes("video") || cat.includes("photo")) return "Camera";
  if (cat.includes("design") || cat.includes("art") || cat.includes("ui")) return "Palette";
  if (cat.includes("business") || cat.includes("startup") || cat.includes("finance")) return "TrendingUp";
  if (cat.includes("fitness") || cat.includes("health") || cat.includes("sport")) return "Activity";
  if (cat.includes("cooking") || cat.includes("food") || cat.includes("coffee")) return "Coffee";
  if (cat.includes("game") || cat.includes("gaming")) return "Gamepad2";
  return "Sparkles";
}
