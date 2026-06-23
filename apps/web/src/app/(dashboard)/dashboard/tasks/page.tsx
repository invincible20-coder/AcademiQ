import { TaskList } from "@/components/tasks/task-list";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";

export const metadata = {
  title: "Tasks | AcademIQ",
  description: "Manage your academic tasks and assignments.",
};

export default function TasksPage() {
  return (
    <div className="max-w-5xl mx-auto w-full h-full space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Tasks
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage your academic tasks and stay on top of deadlines.
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      {/* Main Content */}
      <div className="bg-[rgba(255,255,255,0.01)] border border-[var(--color-border)] rounded-2xl p-6 glass-strong shadow-xl">
        <TaskList />
      </div>
    </div>
  );
}
