"use client";

import { useCourses } from "@/hooks/use-courses";
import { Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function AcademicLoadWidget() {
  const { data: courses = [] } = useCourses({ archived: false });

  const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const maxRecommended = 18; // Common maximum credits per semester
  const loadPercentage = Math.min((totalCredits / maxRecommended) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="glass rounded-2xl p-5 border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
          <Activity className="w-4 h-4 text-emerald-400" /> Academic Load
        </h2>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div className="text-3xl font-bold text-white leading-none">{totalCredits} <span className="text-sm text-[var(--color-text-muted)] font-normal">Credits</span></div>
        <div className="text-xs font-medium text-[var(--color-text-secondary)] flex items-center gap-1 bg-[rgba(255,255,255,0.05)] px-2 py-1 rounded-md">
          <Zap className="w-3 h-3 text-yellow-500" /> {courses.length} Courses
        </div>
      </div>

      <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-2.5 mt-5 overflow-hidden border border-[rgba(255,255,255,0.05)] relative">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ 
            width: `${loadPercentage}%`,
            background: loadPercentage > 85 ? "var(--color-danger)" : loadPercentage > 50 ? "var(--color-warning)" : "var(--color-success)"
          }}
        ></div>
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
        <span>Light</span>
        <span>Optimal</span>
        <span>Heavy</span>
      </div>
    </motion.div>
  );
}
