"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTask } from "@/hooks/use-tasks";
import { Plus } from "lucide-react";

export function CreateTaskDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { mutate: createTask, isPending } = useCreateTask();
  
  const { register, handleSubmit, setValue, reset, watch } = useForm({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
    }
  });

  const onSubmit = (data: any) => {
    const payload = { ...data };
    if (!payload.due_date) delete payload.due_date;
    else payload.due_date = new Date(payload.due_date).toISOString();

    createTask(payload, {
      onSuccess: () => {
        reset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        children ? (children as React.ReactElement) : (
          <Button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        )
      } />
      <DialogContent className="glass-strong border-[var(--color-border)] text-[var(--color-text-primary)]">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Title</label>
            <Input {...register("title", { required: true })} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]" placeholder="E.g. Complete math assignment" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Description (Optional)</label>
            <Textarea {...register("description")} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] min-h-[100px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]" placeholder="Additional notes..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Priority</label>
              <Select value={watch("priority")} onValueChange={(val) => setValue("priority", val)}>
                <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] text-[var(--color-text-primary)]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-[var(--color-border)]">
                  <SelectItem value="low" className="text-[var(--color-text-secondary)] focus:bg-[rgba(255,255,255,0.1)] focus:text-white">Low</SelectItem>
                  <SelectItem value="medium" className="text-[var(--color-text-secondary)] focus:bg-[rgba(255,255,255,0.1)] focus:text-white">Medium</SelectItem>
                  <SelectItem value="high" className="text-[var(--color-text-secondary)] focus:bg-[rgba(255,255,255,0.1)] focus:text-white">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Due Date (Optional)</label>
              <Input type="datetime-local" {...register("due_date")} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] text-[var(--color-text-primary)] [color-scheme:dark]" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white">
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
