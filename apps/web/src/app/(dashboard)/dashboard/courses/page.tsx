import { CourseGrid } from "@/components/courses/course-grid";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";

export const metadata = {
  title: "Courses | AcademIQ",
  description: "Manage your academic courses and curriculum.",
};

export default function CoursesPage() {
  return (
    <div className="max-w-7xl mx-auto w-full h-full space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Courses
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Organize your curriculum. Courses act as the central hub for assignments, sessions, and roadmaps.
          </p>
        </div>
        <CourseFormDialog />
      </div>

      {/* Main Content */}
      <CourseGrid />
    </div>
  );
}
