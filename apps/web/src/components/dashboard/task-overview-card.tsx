"use client";

import { useTasks } from "@/hooks/use-tasks";
import { CheckCircle2, Circle, ListTodo, Percent } from "lucide-react";

export function TaskOverviewCard() {
  const { data: tasks, isLoading } = useTasks();

  const total = tasks?.length || 0;
  const completed = tasks?.filter(t => t.status === "completed").length || 0;
  const pending = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="glass-strong rounded-2xl p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-accent)] opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-blue)] flex items-center justify-center shadow-lg">
          <ListTodo className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">Tasks Overview</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Current status</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse bg-[rgba(255,255,255,0.05)] rounded-xl"></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-1">
              <Circle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{pending}</p>
          </div>
          
          <div className="bg-[var(--color-accent)]/5 p-4 rounded-xl border border-[var(--color-accent)]/20">
            <div className="flex items-center gap-2 text-[var(--color-accent-light)] mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">Done</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{completed}</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Percent className="w-4 h-4 text-[var(--color-text-muted)]" />
            Completion Rate
          </div>
          <span className="font-semibold text-[var(--color-text-primary)]">{completionRate}%</span>
        </div>
      )}
    </div>
  );
}
