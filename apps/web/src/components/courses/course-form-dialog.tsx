"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCourse, useUpdateCourse, Course } from "@/hooks/use-courses";
import { Plus, Edit2 } from "lucide-react";

export function CourseFormDialog({ course, trigger }: { course?: Course, trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!course;
  const { mutate: createCourse, isPending: isCreating } = useCreateCourse();
  const { mutate: updateCourse, isPending: isUpdating } = useUpdateCourse();
  
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      course_name: course?.course_name || "",
      course_code: course?.course_code || "",
      instructor: course?.instructor || "",
      semester: course?.semester || "",
      credits: course?.credits || 3,
      description: course?.description || "",
      color_theme: course?.color_theme || "#3B82F6",
    }
  });

  const onSubmit = (data: any) => {
    if (isEdit && course) {
      updateCourse({ id: course.id, data }, {
        onSuccess: () => setOpen(false)
      });
    } else {
      createCourse(data, {
        onSuccess: () => {
          reset();
          setOpen(false);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        trigger ? (trigger as React.ReactElement) : (
          <Button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            New Course
          </Button>
        )
      } />
      <DialogContent className="glass-strong border-[var(--color-border)] text-[var(--color-text-primary)] max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "Create Course"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Course Name</label>
            <Input {...register("course_name", { required: true })} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]" placeholder="e.g. Database Management Systems" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Course Code</label>
              <Input {...register("course_code")} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]" placeholder="e.g. CS401" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Semester</label>
              <Input {...register("semester")} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]" placeholder="e.g. Fall 2026" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Instructor</label>
              <Input {...register("instructor")} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]" placeholder="e.g. Dr. Smith" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Credits</label>
              <Input type="number" {...register("credits", { valueAsNumber: true })} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]" placeholder="3" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Description (Optional)</label>
            <Textarea {...register("description")} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] placeholder:text-[var(--color-text-muted)] min-h-[80px]" placeholder="Brief overview of the course..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Theme Color</label>
            <div className="flex gap-2 pt-1">
              {["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#64748B"].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("color_theme", c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${watch("color_theme") === c ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating || isUpdating} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white">
              {isCreating || isUpdating ? "Saving..." : "Save Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
