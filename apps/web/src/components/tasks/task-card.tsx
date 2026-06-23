"use client";

import { Task, useToggleTaskComplete, useDeleteTask } from "@/hooks/use-tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatDueDate } from "@/lib/utils";
import { MoreVertical, Trash, Edit2, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function TaskCard({ task }: { task: Task }) {
  const { mutate: toggleComplete } = useToggleTaskComplete();
  const { mutate: deleteTask } = useDeleteTask();
  const isCompleted = task.status === "completed";

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  return (
    <div className={`p-4 rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] flex items-start gap-4 transition-all duration-200 ${isCompleted ? 'opacity-60 grayscale-[0.5]' : 'hover:border-[var(--color-accent)] hover:bg-[rgba(124,58,237,0.05)]'}`}>
      <Checkbox 
        checked={isCompleted} 
        onCheckedChange={() => toggleComplete(task.id)}
        className="mt-1 w-5 h-5 border-[var(--color-text-muted)] data-[state=checked]:bg-[var(--color-accent)] data-[state=checked]:border-[var(--color-accent)]"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className={`font-medium text-sm ${isCompleted ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded outline-none ring-0">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-[var(--color-border)] min-w-[160px]">
              <DropdownMenuItem className="text-[var(--color-text-secondary)] focus:text-white focus:bg-[rgba(255,255,255,0.1)] cursor-pointer">
                <Edit2 className="w-4 h-4 mr-2" /> Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteTask(task.id)}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash className="w-4 h-4 mr-2" /> Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
          
          {task.due_date && (
            <div className="flex items-center text-xs text-[var(--color-text-muted)] gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDueDate(task.due_date)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
