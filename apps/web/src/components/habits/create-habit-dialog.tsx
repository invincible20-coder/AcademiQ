"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHabit } from "@/hooks/use-habits";
import { Plus } from "lucide-react";

export function CreateHabitDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createHabit, isPending } = useCreateHabit();
  
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      name: "",
      description: "",
      frequency: "daily",
      icon: "💧",
      color: "#3B82F6",
    }
  });

  const onSubmit = (data: any) => {
    createHabit(data, {
      onSuccess: () => {
        reset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          New Habit
        </Button>
      } />
      <DialogContent className="glass-strong border-[var(--color-border)] text-[var(--color-text-primary)]">
        <DialogHeader>
          <DialogTitle>Create Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2 col-span-1">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Icon</label>
              <Input {...register("icon")} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] text-center text-xl" />
            </div>
            <div className="space-y-2 col-span-3">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Name</label>
              <Input {...register("name", { required: true })} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] placeholder:text-[var(--color-text-muted)]" placeholder="Drink water" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">Description (Optional)</label>
            <Textarea {...register("description")} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] placeholder:text-[var(--color-text-muted)] min-h-[80px]" placeholder="Drink 8 glasses daily..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Frequency</label>
              <Select value={watch("frequency")} onValueChange={(val) => setValue("frequency", val)}>
                <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-[var(--color-border)]">
                  <SelectItem value="daily" className="focus:bg-[rgba(255,255,255,0.1)] focus:text-white">Daily</SelectItem>
                  <SelectItem value="weekdays" className="focus:bg-[rgba(255,255,255,0.1)] focus:text-white">Weekdays</SelectItem>
                  <SelectItem value="weekends" className="focus:bg-[rgba(255,255,255,0.1)] focus:text-white">Weekends</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">Theme Color</label>
              <div className="flex gap-2 pt-1">
                {["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${watch("color") === c ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white">
              {isPending ? "Saving..." : "Create Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
