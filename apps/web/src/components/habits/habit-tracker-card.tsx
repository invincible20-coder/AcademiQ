"use client";

import { Habit, useHabitLogs, useLogHabit, useDeleteHabit } from "@/hooks/use-habits";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { Loader2, Flame, MoreVertical, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function HabitTrackerCard({ habit }: { habit: Habit }) {
  const { data: logs, isLoading } = useHabitLogs(habit.id);
  const { mutate: logHabit } = useLogHabit();
  const { mutate: deleteHabit } = useDeleteHabit();

  // Generate last 7 days
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

  // Calculate streak
  let streak = 0;
  if (logs) {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let currentDay = today;
    
    // Check if completed today, if not, check yesterday
    const todayLog = sortedLogs.find(l => isSameDay(new Date(l.date), today) && l.completed);
    if (!todayLog) {
      currentDay = subDays(today, 1);
    }

    for (const log of sortedLogs) {
      if (log.completed && isSameDay(new Date(log.date), currentDay)) {
        streak++;
        currentDay = subDays(currentDay, 1);
      } else if (!log.completed && isSameDay(new Date(log.date), currentDay)) {
        break; // streak broken
      } else if (new Date(log.date) < currentDay) {
        break; // missed a day, streak broken
      }
    }
  }

  return (
    <div className="glass-strong p-5 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all flex flex-col justify-between h-full min-h-[200px]">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-[rgba(255,255,255,0.1)] shrink-0"
            style={{ backgroundColor: `${habit.color}20`, color: habit.color || "white" }}
          >
            {habit.icon || "✨"}
          </div>
          <div className="mt-0.5">
            <h3 className="font-semibold text-lg leading-none text-[var(--color-text-primary)]">{habit.name}</h3>
            {habit.description && <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 line-clamp-1">{habit.description}</p>}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">{habit.frequency}</span>
              <span className={`text-xs font-semibold flex items-center gap-1 bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full ${streak > 0 ? "text-orange-500" : "text-[var(--color-text-muted)]"}`}>
                <Flame className="w-3 h-3" /> 
                {streak} streak
              </span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 -mt-1 -mr-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.05)] outline-none">
            <MoreVertical className="w-5 h-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-strong border-[var(--color-border)] min-w-[150px]">
            <DropdownMenuItem 
              onClick={() => deleteHabit(habit.id)}
              className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
            >
              <Trash className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex justify-between items-center gap-2 pt-2 border-t border-[var(--color-border)]">
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isToday = isSameDay(day, today);
          const log = logs?.find(l => l.date === dateStr);
          const isCompleted = log?.completed ?? false;

          return (
            <div key={dateStr} className="flex flex-col items-center gap-2">
              <span className={`text-[10px] font-medium ${isToday ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                {format(day, 'EEE')}
              </span>
              <button
                onClick={() => logHabit({ habitId: habit.id, date: dateStr, completed: !isCompleted })}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                  isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110 active:scale-95"
                } ${
                  isCompleted 
                    ? "text-white shadow-[0_0_12px_rgba(0,0,0,0.2)]" 
                    : "bg-[rgba(255,255,255,0.03)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                }`}
                style={isCompleted ? { backgroundColor: habit.color || "var(--color-accent)" } : {}}
                disabled={isLoading}
              >
                {isCompleted && (
                  <span className="text-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md">
                    ✓
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
