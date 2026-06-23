"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";
import { formatDueDate, calculateStreak } from "@/lib/utils";
import {
  CalendarDays, ClipboardList, Bot, Flame, Target,
  TrendingUp, BookOpen, ArrowRight, Sparkles,
} from "lucide-react";
import { TaskOverviewCard } from "./task-overview-card";
import { UpcomingTasksCard } from "./upcoming-tasks-card";
import { ActiveCoursesWidget } from "./active-courses-widget";
import { AcademicLoadWidget } from "./academic-load-widget";
import { TodaysScheduleWidget } from "./todays-schedule-widget";
import { AcademicHealthWidget } from "./academic-health-widget";
import { AIInsightsWidget } from "./ai-insights-widget";
import Link from "next/link";
import { motion } from "framer-motion";

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="glass rounded-2xl p-5 flex items-start gap-4 hover:border-[var(--color-border-hover)] transition-all duration-300 gradient-border"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {value}
        </p>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
        {sub && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Assignment Row ────────────────────────────────────────────────────────────

function AssignmentRow({ assignment }: { assignment: any }) {
  const { label, urgency } = formatDueDate(assignment.due_at);
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0 group hover:bg-[rgba(255,255,255,0.02)] -mx-4 px-4 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${
          urgency === "overdue" ? "bg-[var(--color-danger)]" :
          urgency === "soon" ? "bg-[var(--color-warning)]" :
          "bg-[var(--color-success)]"
        }`} />
        <div>
          <p className="text-sm font-medium">{assignment.title}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{assignment.course?.course_name ?? "No course"}</p>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
        urgency === "overdue" ? "bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)]" :
        urgency === "soon"    ? "bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)]" :
        "bg-[rgba(16,185,129,0.1)] text-[var(--color-success)]"
      }`}>
        {label}
      </span>
    </div>
  );
}

// ── AI Coach Banner ───────────────────────────────────────────────────────────

function AICoachBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-6 border border-[rgba(124,58,237,0.3)] bg-gradient-to-br from-[rgba(124,58,237,0.12)] via-[rgba(37,99,235,0.08)] to-[rgba(236,72,153,0.06)]"
    >
      {/* Glow effect */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-accent)] opacity-10 rounded-full blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-blue)] flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-light)] mb-1">
            AI Coach
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Great work maintaining your study streak! Your Python quiz score improved by 15% this week.
            Today, focus on completing the <span className="text-[var(--color-text-primary)] font-medium">Data Structures</span> assignment due in 2 days.
          </p>
        </div>
        <Link
          href="/dashboard/study/tutor"
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-[var(--color-accent-light)] hover:text-white transition-colors"
        >
          Ask AI <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export function DashboardHome({ userId }: { userId: string }) {
  const { getToken } = useAuth();

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const token = await getToken();
      const api = createApiClient(token);
      return api.assignments.list("pending");
    },
  });

  const { data: habits = [] } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const token = await getToken();
      const api = createApiClient(token);
      return api.habits.list();
    },
  });

  const upcomingAssignments = (assignments as any[]).slice(0, 5);
  const overdueCount = (assignments as any[]).filter(
    (a: any) => a.due_at && new Date(a.due_at) < new Date()
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋
        </h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* AI Coach Banner */}
      <AICoachBanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ClipboardList}
          label="Pending"
          value={upcomingAssignments.length}
          sub={`${overdueCount} overdue`}
          color="bg-[rgba(245,158,11,0.15)] text-[var(--color-warning)]"
          delay={0.15}
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${7}🔥`}
          sub="days in a row"
          color="bg-[rgba(236,72,153,0.15)] text-[var(--color-pink)]"
          delay={0.2}
        />
        <StatCard
          icon={TrendingUp}
          label="Quiz Score"
          value="82%"
          sub="avg this week"
          color="bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]"
          delay={0.25}
        />
        <StatCard
          icon={Bot}
          label="AI Sessions"
          value={12}
          sub="this month"
          color="bg-[rgba(124,58,237,0.15)] text-[var(--color-accent-light)]"
          delay={0.3}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Assignments */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="glass rounded-2xl p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Upcoming Assignments
            </h2>
            <Link
              href="/dashboard/assignments"
              className="text-xs text-[var(--color-accent-light)] hover:text-white flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-0">
            {upcomingAssignments.length > 0 ? (
              upcomingAssignments.map((a: any) => (
                <AssignmentRow key={a.id} assignment={a} />
              ))
            ) : (
              <div className="text-center py-8 text-[var(--color-text-muted)]">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming assignments</p>
                <Link
                  href="/dashboard/assignments"
                  className="text-xs text-[var(--color-accent-light)] mt-1 inline-block"
                >
                  Add your first assignment →
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="glass rounded-2xl p-5 space-y-3"
        >
          <h2 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Quick Actions
          </h2>
          {[
            { href: "/dashboard/tasks",          icon: ClipboardList, label: "Manage Tasks",        color: "from-indigo-600 to-violet-600" },
            { href: "/dashboard/study/tutor",    icon: Bot,           label: "Ask AI Tutor",        color: "from-violet-600 to-blue-600" },
            { href: "/dashboard/study/roadmap",  icon: BookOpen,      label: "View Roadmap",        color: "from-emerald-600 to-teal-600" },
            { href: "/dashboard/habits",         icon: Flame,         label: "Log Habits",          color: "from-pink-600 to-rose-600" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-transparent hover:border-[var(--color-border)] transition-all duration-200 group"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                {action.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-all group-hover:translate-x-0.5" />
            </Link>
          ))}
        </motion.div>

        {/* Tasks Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-3">
          <TaskOverviewCard />
          <UpcomingTasksCard />
        </div>

        {/* Courses Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:col-span-3">
          <ActiveCoursesWidget />
          <AcademicLoadWidget />
          <TodaysScheduleWidget />
        </div>

        {/* AI & Health Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-3">
          <AcademicHealthWidget />
          <AIInsightsWidget />
        </div>
      </div>
    </div>
  );
}
