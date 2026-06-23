"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleEvent } from "@/hooks/use-schedule";
import { EventFormDialog } from "./event-form-dialog";
import { RRule } from "rrule";

// --- Utility: Expand recurring events ---
function expandEvents(events: ScheduleEvent[], viewStart: Date, viewEnd: Date): ScheduleEvent[] {
  const expanded: ScheduleEvent[] = [];
  
  for (const event of events) {
    if (!event.is_recurring || !event.recurrence_rule) {
      // Non-recurring: just add if it overlaps the view window
      expanded.push(event);
      continue;
    }

    try {
      const rrule = RRule.fromString(event.recurrence_rule);
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      const durationMs = end.getTime() - start.getTime();

      // Find occurrences in the window
      const occurrences = rrule.between(viewStart, viewEnd, true);
      
      for (const occ of occurrences) {
        // Construct new start/end based on occurrence date but original time
        const newStart = new Date(occ);
        newStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
        
        const newEnd = new Date(newStart.getTime() + durationMs);

        expanded.push({
          ...event,
          id: `${event.id}_${newStart.getTime()}`,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString()
        });
      }
    } catch (e) {
      console.error("Failed to parse rrule", e);
      expanded.push(event); // Fallback to single event
    }
  }

  // Sort by start time
  return expanded.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

// --- Week View ---
export function WeekView({ currentDate, events }: { currentDate: Date, events: ScheduleEvent[] }) {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  
  const expandedEvents = useMemo(() => expandEvents(events, start, end), [events, start, end]);

  // Hours 8 AM to 8 PM for timeline
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="flex flex-col h-[600px] bg-[rgba(255,255,255,0.01)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
      {/* Header (Days) */}
      <div className="grid grid-cols-8 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.02)]">
        <div className="p-3 text-center border-r border-[var(--color-border)]"></div>
        {days.map(day => {
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className="p-3 text-center border-r border-[var(--color-border)] last:border-0">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-1">{format(day, "EEE")}</div>
              <div className={`text-xl font-medium w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-primary)]'}`}>
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 relative min-h-[800px]">
          {/* Time Labels */}
          <div className="border-r border-[var(--color-border)] bg-[rgba(255,255,255,0.01)]">
            {hours.map(hour => (
              <div key={hour} className="h-16 text-xs text-[var(--color-text-muted)] text-right pr-2 pt-2 border-b border-transparent">
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {days.map((day, dayIndex) => (
            <div key={day.toISOString()} className="border-r border-[var(--color-border)] last:border-0 relative">
              {/* Hour Grid Lines */}
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-[rgba(255,255,255,0.05)]"></div>
              ))}
              
              {/* Events for this day */}
              {expandedEvents.filter(e => isSameDay(new Date(e.start_time), day)).map(event => {
                const s = new Date(event.start_time);
                const e = new Date(event.end_time);
                // Calculate position based on 8 AM start (hour index)
                const startHour = s.getHours() + (s.getMinutes() / 60);
                const endHour = e.getHours() + (e.getMinutes() / 60);
                
                // Only render if it falls within 8AM - 8PM approx, or clip it
                if (startHour > 20 || endHour < 8) return null;
                
                const top = Math.max(0, (startHour - 8) * 64); // 64px per hour (h-16)
                const height = Math.max(24, (endHour - startHour) * 64);
                
                return (
                  <div 
                    key={event.id}
                    className="absolute left-1 right-1 rounded-md p-1.5 text-xs overflow-hidden shadow-sm group hover:z-10 transition-all border border-[rgba(255,255,255,0.1)]"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: `${event.color_theme || '#3B82F6'}30`,
                      borderLeftColor: event.color_theme || '#3B82F6',
                      borderLeftWidth: '3px'
                    }}
                  >
                    <EventFormDialog 
                      event={{...event, id: event.id.split('_')[0]} as any} 
                      trigger={
                        <button className="w-full h-full text-left flex flex-col items-start cursor-pointer">
                          <div className="font-semibold truncate w-full text-[var(--color-text-primary)]" style={{ color: event.color_theme || 'white' }}>{event.title}</div>
                          {height >= 48 && (
                            <div className="text-[10px] text-[var(--color-text-secondary)] opacity-80 mt-0.5 truncate w-full">
                              {format(s, "h:mm")} - {format(e, "h:mm")}
                            </div>
                          )}
                          {height >= 64 && event.location && (
                            <div className="text-[10px] text-[var(--color-text-secondary)] opacity-80 truncate w-full mt-0.5">
                              {event.location}
                            </div>
                          )}
                        </button>
                      }
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Month View ---
export function MonthView({ currentDate, events }: { currentDate: Date, events: ScheduleEvent[] }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const expandedEvents = useMemo(() => expandEvents(events, startDate, endDate), [events, startDate, endDate]);

  return (
    <div className="flex flex-col bg-[rgba(255,255,255,0.01)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.02)]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="p-3 text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase border-r border-[var(--color-border)] last:border-0">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-t border-[var(--color-border)] -ml-[1px] -mt-[1px]">
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const dayEvents = expandedEvents.filter(e => isSameDay(new Date(e.start_time), day)).slice(0, 3);
          const moreEvents = expandedEvents.filter(e => isSameDay(new Date(e.start_time), day)).length > 3;

          return (
            <div key={day.toISOString()} className={`min-h-[120px] p-2 border-r border-b border-[var(--color-border)] ${!isCurrentMonth ? 'bg-[rgba(255,255,255,0.02)] opacity-50' : 'bg-transparent'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-primary)]'}`}>
                  {format(day, "d")}
                </div>
                <EventFormDialog selectedDate={day} trigger={
                  <button className="text-[var(--color-text-muted)] hover:text-white transition-colors opacity-0 hover:opacity-100 group-hover/cell:opacity-100 w-6 h-6 flex items-center justify-center">+</button>
                } />
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <EventFormDialog 
                    key={event.id}
                    event={{...event, id: event.id.split('_')[0]} as any}
                    trigger={
                      <div className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: `${event.color_theme || '#3B82F6'}30`, color: event.color_theme || 'white', borderLeft: `2px solid ${event.color_theme || '#3B82F6'}` }}>
                        {format(new Date(event.start_time), "HH:mm")} {event.title}
                      </div>
                    }
                  />
                ))}
                {moreEvents && <div className="text-[10px] text-[var(--color-text-muted)] pl-1">+ more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Agenda View ---
export function AgendaView({ events }: { events: ScheduleEvent[] }) {
  const expandedEvents = useMemo(() => expandEvents(events, subWeeks(new Date(), 1), addMonths(new Date(), 3)), [events]);
  
  // Group by date
  const grouped = expandedEvents.reduce((acc, event) => {
    const dateStr = format(new Date(event.start_time), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>);

  const dates = Object.keys(grouped).sort();

  if (dates.length === 0) {
    return (
      <div className="text-center py-20 bg-[rgba(255,255,255,0.01)] border border-[var(--color-border)] rounded-2xl">
        <p className="text-[var(--color-text-muted)]">No upcoming events found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {dates.map(dateStr => {
        const date = parseISO(dateStr);
        const dayEvents = grouped[dateStr];
        const isToday = isSameDay(date, new Date());
        
        return (
          <div key={dateStr} className="flex flex-col sm:flex-row gap-6 relative">
            <div className="sm:w-32 shrink-0 sm:text-right sticky top-4">
              <div className={`text-sm font-semibold uppercase tracking-wider ${isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                {format(date, "EEEE")}
              </div>
              <div className={`text-3xl font-light ${isToday ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>
                {format(date, "MMM d")}
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              {dayEvents.map(event => (
                <div key={event.id} className="glass-strong border border-[var(--color-border)] rounded-xl p-4 flex gap-4 hover:border-[var(--color-border-hover)] transition-colors group">
                  <div className="w-1.5 rounded-full shrink-0" style={{ backgroundColor: event.color_theme || "var(--color-accent)" }}></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <EventFormDialog 
                        event={{...event, id: event.id.split('_')[0]} as any}
                        trigger={
                          <button className="text-lg font-semibold text-[var(--color-text-primary)] hover:underline text-left">
                            {event.title}
                          </button>
                        }
                      />
                      <span className="text-xs font-medium px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                        {event.event_type.replace("_", " ")}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                        {event.is_all_day ? "All Day" : `${format(new Date(event.start_time), "h:mm a")} - ${format(new Date(event.end_time), "h:mm a")}`}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
