"use client";

import { useTasks } from "@/hooks/use-tasks";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import { ClipboardList, Loader2 } from "lucide-react";

export function TaskList() {
  const { data: tasks, isLoading, error } = useTasks();

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" /></div>;
  }

  if (error) {
    return <div className="p-4 bg-red-500/10 text-red-500 rounded-lg text-sm">Failed to load tasks.</div>;
  }

  const activeTasks = tasks?.filter(t => t.status !== "completed") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  if (!tasks?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--color-border)] rounded-2xl bg-[rgba(255,255,255,0.01)] h-[400px]">
        <div className="w-12 h-12 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl flex items-center justify-center mb-4 shadow-lg">
          <ClipboardList className="w-6 h-6 text-[var(--color-text-muted)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No Tasks Yet</h3>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
          You haven't added any tasks. Get started by creating your first task to stay organized.
        </p>
        <CreateTaskDialog />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"></div>
          Active Tasks ({activeTasks.length})
        </h3>
        <div className="grid gap-3">
          {activeTasks.map(task => <TaskCard key={task.id} task={task} />)}
          {activeTasks.length === 0 && (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)] italic border border-dashed border-[var(--color-border)] rounded-xl">
              You're all caught up!
            </div>
          )}
        </div>
      </div>

      {completedTasks.length > 0 && (
        <div className="pt-4 border-t border-[var(--color-border)]">
          <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2 opacity-70">
            <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]"></div>
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className="grid gap-3">
            {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
      )}
    </div>
  );
}
