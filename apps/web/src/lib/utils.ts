import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDueDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  // Very basic relative formatting
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function calculateStreak(habits: any[]) {
  // Mock logic since we haven't built the full habits table yet
  return habits?.length || 0;
}
