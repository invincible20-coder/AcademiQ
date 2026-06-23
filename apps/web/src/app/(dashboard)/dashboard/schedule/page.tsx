"use client";

import { useState } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { useScheduleEvents } from "@/hooks/use-schedule";
import { WeekView, MonthView, AgendaView } from "@/components/schedule/calendar-views";
import { EventFormDialog } from "@/components/schedule/event-form-dialog";
import { ChevronLeft, ChevronRight, Loader2, LayoutList, CalendarDays, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewType = "week" | "month" | "agenda";

export default function SchedulePage() {
  const [view, setView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // We fetch a wide window of events to allow smooth scrolling and rrule expansion
  const startDateStr = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString();
  const endDateStr = new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString();
  
  const { data: events, isLoading, error } = useScheduleEvents({
    start_date: startDateStr,
    end_date: endDateStr
  });

  const next = () => {
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
  };

  const prev = () => {
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
  };

  const today = () => setCurrentDate(new Date());

  const displayDate = view === "month" 
    ? format(currentDate, "MMMM yyyy") 
    : view === "week"
      ? `Week of ${format(currentDate, "MMM d, yyyy")}`
      : "Upcoming Agenda";

  return (
    <div className="max-w-7xl mx-auto w-full h-full space-y-6 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Schedule
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage your classes, study sessions, and exams in one place.
          </p>
        </div>
        <EventFormDialog selectedDate={currentDate} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 glass rounded-xl border border-[var(--color-border)]">
        
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          {view !== "agenda" && (
            <>
              <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8 text-[var(--color-text-secondary)] hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={today} className="h-8 text-[var(--color-text-muted)] hover:text-white">
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8 text-[var(--color-text-secondary)] hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          <span className="text-base font-semibold text-[var(--color-text-primary)] w-48 text-center sm:text-left sm:ml-2">
            {displayDate}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[var(--color-border)]">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-3 text-xs ${view === 'week' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'}`}
            onClick={() => setView('week')}
          >
            <CalendarRange className="w-3.5 h-3.5 mr-1.5" /> Week
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-3 text-xs ${view === 'month' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'}`}
            onClick={() => setView('month')}
          >
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Month
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-3 text-xs ${view === 'agenda' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'}`}
            onClick={() => setView('agenda')}
          >
            <LayoutList className="w-3.5 h-3.5 mr-1.5" /> Agenda
          </Button>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20 text-center">Failed to load schedule.</div>
        ) : (
          <div className="animate-fade-up">
            {view === "week" && <WeekView currentDate={currentDate} events={events || []} />}
            {view === "month" && <MonthView currentDate={currentDate} events={events || []} />}
            {view === "agenda" && <AgendaView events={events || []} />}
          </div>
        )}
      </div>

    </div>
  );
}
