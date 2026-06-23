"use client";

import { Activity, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/use-tasks";
import { useHabits } from "@/hooks/use-habits";

export function AcademicHealthWidget() {
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();

  // Basic mock score calculation based on completion
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length || 1;
  const taskScore = (completedTasks / totalTasks) * 50;

  const activeHabits = habits.filter(h => h.is_active).length;
  const habitScore = Math.min(activeHabits * 10, 50);

  const totalScore = Math.round(taskScore + habitScore);
  
  let color = "text-green-400";
  let status = "Excellent";
  
  if (totalScore < 40) {
    color = "text-red-400";
    status = "Needs Attention";
  } else if (totalScore < 70) {
    color = "text-yellow-400";
    status = "Good";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="glass rounded-2xl p-5 border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
          <Activity className="w-4 h-4 text-rose-400" /> Academic Health
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-[rgba(255,255,255,0.1)]"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={color}
              strokeWidth="3"
              strokeDasharray={`${totalScore}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-xl font-bold">{totalScore}</div>
        </div>
        
        <div>
          <div className={`text-lg font-bold ${color}`}>{status}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Based on tasks & habits
          </div>
        </div>
      </div>
    </motion.div>
  );
}
