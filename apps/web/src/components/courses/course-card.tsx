"use client";

import Link from "next/link";
import { Course, useArchiveCourse, useDeleteCourse } from "@/hooks/use-courses";
import { MoreVertical, BookOpen, Clock, User, Archive, Trash, Edit2, Play } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CourseFormDialog } from "./course-form-dialog";

export function CourseCard({ course }: { course: Course }) {
  const { mutate: archiveCourse } = useArchiveCourse();
  const { mutate: deleteCourse } = useDeleteCourse();

  return (
    <div className="glass-strong rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all overflow-hidden flex flex-col group relative">
      <div 
        className="h-2 w-full absolute top-0 left-0" 
        style={{ backgroundColor: course.color_theme || "var(--color-accent)" }}
      />
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4 mt-2">
          <div className="flex gap-3 items-center">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
              style={{ backgroundColor: `${course.color_theme}20`, color: course.color_theme || "white" }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <Link href={`/dashboard/courses/${course.id}`}>
                <h3 className="font-semibold text-lg text-[var(--color-text-primary)] leading-tight hover:underline">
                  {course.course_name}
                </h3>
              </Link>
              {course.course_code && (
                <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded mt-1 inline-block">
                  {course.course_code}
                </span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 -mr-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <MoreVertical className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong border-[var(--color-border)] min-w-[160px]">
              <CourseFormDialog 
                course={course} 
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Course
                  </DropdownMenuItem>
                } 
              />
              <DropdownMenuItem 
                onClick={() => archiveCourse(course.id)}
                className="cursor-pointer"
              >
                <Archive className="w-4 h-4 mr-2" /> {course.is_archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--color-border)]" />
              <DropdownMenuItem 
                onClick={() => deleteCourse(course.id)}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {course.description && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1">
            {course.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-4">
            {course.instructor && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {course.instructor}
              </span>
            )}
            {course.semester && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {course.semester}
              </span>
            )}
          </div>
          {course.credits && (
            <span className="font-semibold px-2 py-1 bg-[rgba(255,255,255,0.05)] rounded text-[var(--color-text-primary)]">
              {course.credits} Cr
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
