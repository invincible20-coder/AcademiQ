"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  BookOpen,
  Target,
  Flame,
  BarChart3,
  Bot,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "Academic",
    items: [
      { href: "/dashboard/schedule",    label: "Schedule",    icon: CalendarDays },
      { href: "/dashboard/tasks",       label: "Assignments", icon: ClipboardList },
      { href: "/dashboard/courses",     label: "Courses",     icon: BookOpen },
    ],
  },
  {
    section: "AI Study",
    items: [
      { href: "/dashboard/roadmaps",    label: "Roadmap",   icon: GraduationCap },
      { href: "/dashboard/ai",          label: "AI Tutor",  icon: Bot },
      { href: "/dashboard/quizzes",     label: "Assessments",icon: Flame },
      { href: "/dashboard/documents",   label: "Documents", icon: BookOpen },
    ],
  },
  {
    section: "Productivity",
    items: [
      { href: "/dashboard/habits",  label: "Habits",  icon: Flame },
      { href: "/dashboard/goals",   label: "Goals",   icon: Target },
      { href: "/dashboard/planner", label: "Planner", icon: CalendarDays },
    ],
  },
  {
    section: "Insights",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn("glass-strong w-64 shrink-0 border-r border-[var(--color-border)] flex flex-col h-full overflow-y-auto", className)}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--color-border)]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-blue)] flex items-center justify-center shadow-lg">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            AcademIQ
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {NAV_ITEMS.map((section) => (
          <div key={section.section}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              {section.section}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                        isActive
                          ? "bg-[var(--color-accent-glow)] text-[var(--color-accent-light)] border border-[rgba(124,58,237,0.3)]"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.04)]"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isActive ? "text-[var(--color-accent-light)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="w-3 h-3 text-[var(--color-accent-light)]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User streak footer */}
      <div className="px-4 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(236,72,153,0.08)] border border-[rgba(236,72,153,0.2)]">
          <span className="flame text-lg">🔥</span>
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">Study Streak</p>
            <p className="text-xs text-[var(--color-text-muted)]">Keep it going!</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
