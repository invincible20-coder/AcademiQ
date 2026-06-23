"use client";

import { useCourses } from "@/hooks/use-courses";
import { BookOpen, CheckCircle, Archive } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function ActiveCoursesWidget() {
  const { data: courses = [] } = useCourses({ archived: false });
  const { data: archivedCourses = [] } = useCourses({ archived: true });

  const activeCount = courses.length;
  const archivedCount = archivedCourses.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.4 }}
      className="glass rounded-2xl p-5 border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
          <BookOpen className="w-4 h-4 text-blue-400" /> Active Courses
        </h2>
        <Link href="/dashboard/courses" className="text-xs text-[var(--color-text-muted)] hover:text-white transition-colors">
          Manage
        </Link>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1 bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)] rounded-xl p-4 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-3xl font-bold text-white mb-1 relative z-10">{activeCount}</div>
          <div className="text-xs text-[var(--color-text-secondary)] font-medium flex items-center justify-center gap-1 relative z-10">
            <CheckCircle className="w-3 h-3 text-green-400" /> Active
          </div>
        </div>
        <div className="flex-1 bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)] rounded-xl p-4 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gray-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1 relative z-10">{archivedCount}</div>
          <div className="text-xs text-[var(--color-text-secondary)] font-medium flex items-center justify-center gap-1 relative z-10">
            <Archive className="w-3 h-3 text-[var(--color-text-muted)]" /> Archived
          </div>
        </div>
      </div>
    </motion.div>
  );
}
