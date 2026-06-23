"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useConversations } from "@/hooks/use-ai";

export function AIInsightsWidget() {
  const { data: conversations = [] } = useConversations();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="glass rounded-2xl p-5 border border-[var(--color-accent)]/30 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2 text-white" style={{ fontFamily: "var(--font-display)" }}>
          <Sparkles className="w-4 h-4 text-[var(--color-accent)]" /> AI Insights
        </h2>
      </div>
      
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">
        Your academic coach is ready. Ask about your schedule, get help with assignments, or plan your study sessions based on your current workload.
      </p>

      <Link href="/dashboard/ai" className="mt-4 inline-flex items-center text-sm text-[var(--color-accent)] hover:text-white font-medium transition-colors">
        Chat with AcademIQ <ArrowRight className="w-4 h-4 ml-1" />
      </Link>
    </motion.div>
  );
}
