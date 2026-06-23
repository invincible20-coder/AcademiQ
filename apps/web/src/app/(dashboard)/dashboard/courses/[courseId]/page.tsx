"use client";

import { use } from "react";
import Link from "next/link";
import { useCourse } from "@/hooks/use-courses";
import { Loader2, ArrowLeft, BookOpen, Clock, User, Calendar, FileText, Activity, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data: course, isLoading, error } = useCourse(courseId);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>;
  }

  if (error || !course) {
    return (
      <div className="p-8 text-center max-w-md mx-auto mt-20 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <p className="text-red-500 font-medium mb-4">Course not found or failed to load.</p>
        <Link href="/dashboard/courses">
          <Button variant="outline" className="border-red-500/50 hover:bg-red-500/20 text-red-400">Return to Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full h-full space-y-8 animate-fade-up pb-12">
      {/* Navigation */}
      <Link href="/dashboard/courses" className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors group">
        <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
        Back to Courses
      </Link>

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-[var(--color-border)] shadow-2xl glass-strong">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundColor: course.color_theme || "var(--color-accent)" }}></div>
        <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: course.color_theme || "var(--color-accent)" }}></div>
        
        <div className="p-8 sm:p-10 relative z-10 flex flex-col sm:flex-row gap-8 items-start sm:items-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-[rgba(255,255,255,0.1)]" style={{ backgroundColor: `${course.color_theme}20`, color: course.color_theme || "white" }}>
            <BookOpen className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {course.course_name}
              </h1>
              {course.is_archived && (
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] uppercase tracking-wider">Archived</span>
              )}
            </div>
            
            {course.description && (
              <p className="text-base text-[var(--color-text-secondary)] max-w-3xl mb-6">
                {course.description}
              </p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {course.course_code && (
                <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-mono bg-[rgba(255,255,255,0.05)] px-2.5 py-1 rounded-md">
                  {course.course_code}
                </div>
              )}
              {course.instructor && (
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <User className="w-4 h-4 text-[var(--color-text-muted)]" /> {course.instructor}
                </div>
              )}
              {course.semester && (
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" /> {course.semester}
                </div>
              )}
              {course.credits !== null && (
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <Activity className="w-4 h-4 text-[var(--color-text-muted)]" /> {course.credits} Credits
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Integration Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Assignments Placeholder */}
        <div className="glass-strong p-6 rounded-2xl border border-[var(--color-border)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Assignments</h3>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 relative z-10">
            Track homework, essays, and projects for this course. (Coming in Unit 5)
          </p>
          <Button variant="outline" className="w-full bg-[rgba(255,255,255,0.02)] border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed">
            View Assignments
          </Button>
        </div>

        {/* Study Sessions Placeholder */}
        <div className="glass-strong p-6 rounded-2xl border border-[var(--color-border)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Study Sessions</h3>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 relative z-10">
            Log time spent studying and analyze your focus metrics. (Coming Soon)
          </p>
          <Button variant="outline" className="w-full bg-[rgba(255,255,255,0.02)] border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed">
            Start Session
          </Button>
        </div>

        {/* AI Roadmaps Placeholder */}
        <div className="glass-strong p-6 rounded-2xl border border-[var(--color-border)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <BrainCircuit className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
              <BrainCircuit className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">AI Roadmap</h3>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 relative z-10">
            Generate an AI-powered personalized study plan for this syllabus. (Coming Soon)
          </p>
          <Button variant="outline" className="w-full bg-[rgba(255,255,255,0.02)] border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed">
            Generate Roadmap
          </Button>
        </div>

      </div>
    </div>
  );
}
