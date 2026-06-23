"use client";

import { useTasks } from "@/hooks/use-tasks";
import { formatDueDate } from "@/lib/utils";
import { CalendarClock, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function UpcomingTasksCard() {
  const { data: tasks, isLoading } = useTasks();

  const priorityColors = {
    high: "bg-red-500/10 text-red-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    low: "bg-green-500/10 text-green-500",
  };

  const upcoming = tasks
    ?.filter(t => t.status !== "completed" && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5) || [];

  return (
    <div className="glass-strong rounded-2xl p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center border border-[var(--color-border)]">
            <CalendarClock className="w-5 h-5 text-[var(--color-pink)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Upcoming Deadlines</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">Next 5 due</p>
          </div>
        </div>
        <Link href="/dashboard/tasks" className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" /></div>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-[rgba(255,255,255,0.01)]">
          <CheckCircle2 className="w-6 h-6 text-[var(--color-text-muted)] mx-auto mb-2 opacity-50" />
          <p className="text-sm text-[var(--color-text-secondary)]">No upcoming deadlines.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{task.title}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatDueDate(task.due_date!)}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border-none shrink-0 ${priorityColors[task.priority]}`}>
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
