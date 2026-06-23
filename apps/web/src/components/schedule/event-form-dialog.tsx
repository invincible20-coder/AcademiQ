"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateScheduleEvent, useUpdateScheduleEvent, ScheduleEvent } from "@/hooks/use-schedule";
import { useCourses } from "@/hooks/use-courses";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, AlignLeft } from "lucide-react";
import { format, parseISO } from "date-fns";

export function EventFormDialog({ event, trigger, selectedDate }: { event?: ScheduleEvent, trigger?: React.ReactNode, selectedDate?: Date }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!event;
  const { mutate: createEvent, isPending: isCreating } = useCreateScheduleEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateScheduleEvent();
  const { data: courses } = useCourses({ archived: false });

  // Default dates for new events
  const defaultStart = selectedDate || new Date();
  if (!selectedDate) {
    defaultStart.setMinutes(0, 0, 0);
    defaultStart.setHours(defaultStart.getHours() + 1);
  }
  
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const formatForInput = (date: Date | string) => {
    if (!date) return "";
    const d = typeof date === "string" ? parseISO(date) : date;
    // Format to yyyy-MM-ddThh:mm
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      course_id: event?.course_id || "none",
      event_type: event?.event_type || "CLASS",
      location: event?.location || "",
      start_time: formatForInput(event?.start_time || defaultStart),
      end_time: formatForInput(event?.end_time || defaultEnd),
      is_all_day: event?.is_all_day || false,
      is_recurring: event?.is_recurring || false,
      recurrence_rule: event?.recurrence_rule || "FREQ=WEEKLY",
      color_theme: event?.color_theme || "#3B82F6",
    }
  });

  const isAllDay = watch("is_all_day");
  const isRecurring = watch("is_recurring");

  const onSubmit = (data: any) => {
    const payload = { ...data };
    if (payload.course_id === "none") payload.course_id = null;
    
    // Convert local time strings to UTC ISO strings
    payload.start_time = new Date(payload.start_time).toISOString();
    payload.end_time = new Date(payload.end_time).toISOString();

    if (!payload.is_recurring) {
      payload.recurrence_rule = null;
    }

    if (isEdit && event) {
      updateEvent({ id: event.id, data: payload }, {
        onSuccess: () => setOpen(false)
      });
    } else {
      createEvent(payload, {
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
            New Event
          </Button>
        )
      } />
      <DialogContent className="glass-strong border-[var(--color-border)] text-[var(--color-text-primary)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          
          <div className="space-y-3">
            <Input 
              {...register("title", { required: true })} 
              className="text-lg font-medium bg-[rgba(255,255,255,0.02)] border-0 border-b border-[var(--color-border)] rounded-none px-0 focus-visible:ring-0 shadow-none placeholder:text-[var(--color-text-muted)]" 
              placeholder="Event Title" 
            />
            
            <div className="flex gap-4">
              <Select value={watch("event_type")} onValueChange={(v) => setValue("event_type", v)}>
                <SelectTrigger className="w-1/2 bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-[var(--color-border)]">
                  {["CLASS", "LAB", "TUTORIAL", "EXAM", "ASSIGNMENT", "STUDY_SESSION", "REVISION", "PERSONAL"].map(type => (
                    <SelectItem key={type} value={type}>{type.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={watch("course_id")} onValueChange={(v) => setValue("course_id", v)}>
                <SelectTrigger className="w-1/2 bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]">
                  <SelectValue placeholder="Related Course (Optional)" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-[var(--color-border)]">
                  <SelectItem value="none">No Course</SelectItem>
                  {courses?.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 py-2 border-y border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-[var(--color-text-muted)]" /> All Day
              </div>
              <Switch checked={isAllDay} onCheckedChange={(c) => setValue("is_all_day", c)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Start</label>
                <Input type={isAllDay ? "date" : "datetime-local"} {...register("start_time", { required: true })} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">End</label>
                <Input type={isAllDay ? "date" : "datetime-local"} {...register("end_time", { required: true })} className="bg-[rgba(255,255,255,0.05)] border-[var(--color-border)] text-sm" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="w-4 h-4 text-[var(--color-text-muted)]" /> Recurring Event
              </div>
              <Switch checked={isRecurring} onCheckedChange={(c) => setValue("is_recurring", c)} />
            </div>
            
            {isRecurring && (
              <div className="pl-6 pb-2">
                <Select value={watch("recurrence_rule")} onValueChange={(v) => setValue("recurrence_rule", v)}>
                  <SelectTrigger className="w-full bg-[rgba(255,255,255,0.05)] border-[var(--color-border)]">
                    <SelectValue placeholder="Recurrence" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-[var(--color-border)]">
                    <SelectItem value="FREQ=DAILY">Daily</SelectItem>
                    <SelectItem value="FREQ=WEEKLY">Weekly</SelectItem>
                    <SelectItem value="FREQ=WEEKLY;BYDAY=MO,WE,FR">Mon, Wed, Fri</SelectItem>
                    <SelectItem value="FREQ=WEEKLY;BYDAY=TU,TH">Tue, Thu</SelectItem>
                    <SelectItem value="FREQ=MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
              <Input {...register("location")} placeholder="Location (e.g., Room 101, Zoom Link)" className="bg-[rgba(255,255,255,0.02)] border-transparent focus-visible:bg-[rgba(255,255,255,0.05)] h-9" />
            </div>
            <div className="flex items-start gap-2">
              <AlignLeft className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mt-2.5" />
              <Textarea {...register("description")} placeholder="Add description or notes..." className="bg-[rgba(255,255,255,0.02)] border-transparent focus-visible:bg-[rgba(255,255,255,0.05)] min-h-[80px]" />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
            <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Theme Color</label>
            <div className="flex gap-2">
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
              {isCreating || isUpdating ? "Saving..." : "Save Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
