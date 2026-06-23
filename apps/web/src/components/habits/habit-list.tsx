"use client";

import { useHabits } from "@/hooks/use-habits";
import { HabitTrackerCard } from "./habit-tracker-card";
import { Loader2, Flame } from "lucide-react";
import { CreateHabitDialog } from "./create-habit-dialog";

export function HabitList() {
  const { data: habits, isLoading, error } = useHabits();

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" /></div>;
  }

  if (error) {
    return <div className="p-4 bg-red-500/10 text-red-500 rounded-lg text-sm">Failed to load habits.</div>;
  }

  if (!habits?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--color-border)] rounded-2xl bg-[rgba(255,255,255,0.01)] h-[400px]">
        <div className="w-14 h-14 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center mb-5 shadow-lg relative">
          <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
          <Flame className="w-7 h-7 text-orange-500 relative z-10" />
        </div>
        <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-2" style={{ fontFamily: "var(--font-display)" }}>Build Better Habits</h3>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-8 leading-relaxed">
          Track your daily routines and build powerful streaks to stay consistent with your academic goals.
        </p>
        <CreateHabitDialog />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {habits.map((habit) => (
        <HabitTrackerCard key={habit.id} habit={habit} />
      ))}
    </div>
  );
}
