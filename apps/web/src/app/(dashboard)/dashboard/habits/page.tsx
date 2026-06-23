import { HabitList } from "@/components/habits/habit-list";
import { CreateHabitDialog } from "@/components/habits/create-habit-dialog";

export const metadata = {
  title: "Habits | AcademIQ",
  description: "Track your daily academic habits and build streaks.",
};

export default function HabitsPage() {
  return (
    <div className="max-w-5xl mx-auto w-full h-full space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Habits
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Build consistency through daily academic habits.
          </p>
        </div>
        <CreateHabitDialog />
      </div>

      {/* Main Content */}
      <div className="bg-[rgba(255,255,255,0.01)] border border-[var(--color-border)] rounded-2xl p-6 glass-strong shadow-xl min-h-[500px]">
        <HabitList />
      </div>
    </div>
  );
}
