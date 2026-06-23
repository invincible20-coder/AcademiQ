"use client";

import { useState } from "react";
import { useCourses } from "@/hooks/use-courses";
import { CourseCard } from "./course-card";
import { Loader2, Search, BookDashed, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseFormDialog } from "./course-form-dialog";

export function CourseGrid() {
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState<string>("active");
  const { data: courses, isLoading, error } = useCourses({ 
    search: search || undefined, 
    archived: archived === "all" ? undefined : archived === "archived" 
  });

  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border border-[var(--color-border)]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..." 
            className="pl-9 bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] text-sm h-10"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={archived} onValueChange={setArchived}>
            <SelectTrigger className="w-[140px] bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] h-10">
              <Filter className="w-3.5 h-3.5 mr-2 text-[var(--color-text-muted)]" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="glass-strong border-[var(--color-border)]">
              <SelectItem value="active" className="focus:bg-[rgba(255,255,255,0.1)]">Active Courses</SelectItem>
              <SelectItem value="archived" className="focus:bg-[rgba(255,255,255,0.1)]">Archived</SelectItem>
              <SelectItem value="all" className="focus:bg-[rgba(255,255,255,0.1)]">All Courses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20">Failed to load courses.</div>
      ) : !courses?.length ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-[var(--color-border)] rounded-2xl bg-[rgba(255,255,255,0.01)] min-h-[400px]">
          <div className="w-16 h-16 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center mb-6 shadow-xl relative">
            <div className="absolute inset-0 bg-[var(--color-accent)]/20 blur-xl rounded-full"></div>
            <BookDashed className="w-8 h-8 text-[var(--color-accent)] relative z-10" />
          </div>
          <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-3" style={{ fontFamily: "var(--font-display)" }}>
            {search ? "No courses found matching your search" : "Your Academic Hub Starts Here"}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mb-8 leading-relaxed">
            {search 
              ? "Try adjusting your filters or search terms."
              : "Courses are the foundation of AcademIQ. Create a course to attach assignments, study sessions, and AI roadmaps to it."}
          </p>
          {!search && <CourseFormDialog />}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
