"use client";

import { useScheduleEvents } from "@/hooks/use-schedule";
import { Clock, MapPin, Calendar as CalendarIcon, Play, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { format, isSameDay, isAfter, isBefore, addDays } from "date-fns";
import Link from "next/link";
import { RRule } from "rrule";
import { useMemo, useState, useEffect } from "react";

export function TodaysScheduleWidget() {
  const [now, setNow] = useState(new Date());

  // Update "now" every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const { data: events = [], isLoading } = useScheduleEvents({
    start_date: new Date(now.getTime() - 86400000).toISOString(), // Fetch a bit of buffer
    end_date: new Date(now.getTime() + 86400000 * 7).toISOString()
  });

  const todaysEvents = useMemo(() => {
    const expanded: any[] = [];
    for (const event of events) {
      if (!event.is_recurring) {
        if (isSameDay(new Date(event.start_time), now)) expanded.push(event);
      } else if (event.recurrence_rule) {
        try {
          const rrule = RRule.fromString(event.recurrence_rule);
          const s = new Date(event.start_time);
          const occurrences = rrule.between(todayStart, todayEnd, true);
          for (const occ of occurrences) {
            const newStart = new Date(occ);
            newStart.setHours(s.getHours(), s.getMinutes(), 0, 0);
            const newEnd = new Date(newStart.getTime() + (new Date(event.end_time).getTime() - s.getTime()));
            expanded.push({ ...event, start_time: newStart.toISOString(), end_time: newEnd.toISOString() });
          }
        } catch (e) {}
      }
    }
    return expanded.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [events, now, todayStart, todayEnd]);

  const currentEvent = todaysEvents.find(e => isBefore(new Date(e.start_time), now) && isAfter(new Date(e.end_time), now));
  const upcomingEvents = todaysEvents.filter(e => isAfter(new Date(e.start_time), now));
  const nextEvent = upcomingEvents[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="glass rounded-2xl p-5 border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
          <CalendarIcon className="w-4 h-4 text-violet-400" /> Today's Schedule
        </h2>
        <Link href="/dashboard/schedule" className="text-xs text-[var(--color-text-muted)] hover:text-white transition-colors">
          View Calendar
        </Link>
      </div>

      <div className="flex-1 space-y-4">
        {currentEvent ? (
          <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--color-border)] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 animate-pulse"></div>
            <div className="flex items-center gap-2 text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
              <Play className="w-3 h-3 fill-green-400" /> Happening Now
            </div>
            <div className="text-lg font-semibold text-white mb-1" style={{ color: currentEvent.color_theme || "white" }}>{currentEvent.title}</div>
            <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-3">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Until {format(new Date(currentEvent.end_time), "h:mm a")}</span>
              {currentEvent.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {currentEvent.location}</span>}
            </div>
          </div>
        ) : (
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No active events right now</p>
          </div>
        )}

        {nextEvent && (
          <div className="flex items-start gap-3 relative before:absolute before:left-1.5 before:top-6 before:bottom-0 before:w-px before:bg-[var(--color-border)]">
            <div className="w-3 h-3 rounded-full shrink-0 mt-1 relative z-10" style={{ backgroundColor: nextEvent.color_theme || "var(--color-accent)" }}></div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] font-medium mb-0.5">{format(new Date(nextEvent.start_time), "h:mm a")}</div>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{nextEvent.title}</div>
              {nextEvent.location && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{nextEvent.location}</div>}
            </div>
          </div>
        )}
        
        {upcomingEvents.length > 1 && (
          <div className="flex items-center gap-2 pl-1.5 text-xs text-[var(--color-text-muted)] pt-2">
            <MoreHorizontal className="w-4 h-4" /> {upcomingEvents.length - 1} more event{upcomingEvents.length - 1 > 1 ? 's' : ''} today
          </div>
        )}
        
        {!currentEvent && upcomingEvents.length === 0 && !isLoading && (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-2">Your day is clear! 🌟</p>
        )}
      </div>
    </motion.div>
  );
}
