"use client";

import { useState } from "react";
import Link from "next/link";
import { useRoadmaps, useGenerateRoadmap } from "@/hooks/use-roadmaps";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, Clock, Target, ArrowRight, Loader2, Compass } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export default function RoadmapsPage() {
  const { data: roadmaps, isLoading } = useRoadmaps();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 font-display">Learning Roadmaps</h1>
          <p className="text-[var(--color-text-secondary)] text-lg">Adaptive milestones powered by your real performance.</p>
        </div>
        
        <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
          <DialogTrigger render={
            <Button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white gap-2 h-11 px-6 shadow-lg shadow-[var(--color-accent)]/20">
              <Plus className="w-5 h-5" /> Generate Roadmap
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] glass border border-[var(--color-border)] p-0 overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-[var(--color-accent)] to-purple-500" />
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">New Roadmap</DialogTitle>
              </DialogHeader>
              <RoadmapBuilderForm onSuccess={() => setIsBuilderOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!roadmaps || roadmaps.length === 0 ? (
        <div className="glass border border-[var(--color-border)] rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Compass className="w-10 h-10 text-[var(--color-accent)]" />
          </div>
          <h3 className="text-2xl font-medium text-white mb-3">No Roadmaps Yet</h3>
          <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
            Generate an adaptive learning roadmap. The AI will analyze your weak topics and construct the perfect path.
          </p>
          <Button onClick={() => setIsBuilderOpen(true)} className="bg-[var(--color-accent)] text-white">
            <Plus className="w-4 h-4 mr-2" /> Create First Roadmap
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((roadmap) => (
            <RoadmapCard key={roadmap.id} roadmap={roadmap} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapBuilderForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutateAsync: generateRoadmap, isPending } = useGenerateRoadmap();
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !goal) return;
    
    try {
      await generateRoadmap({
        title,
        goal,
        target_date: targetDate ? new Date(targetDate).toISOString() : undefined
      });
      onSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Roadmap Title</label>
        <input 
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Database Management Mastery"
          className="w-full bg-black/40 border border-[var(--color-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Primary Goal</label>
        <textarea 
          required
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="I want to pass my final exam next month with a focus on SQL indexing."
          rows={3}
          className="w-full bg-black/40 border border-[var(--color-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Target Date (Optional)</label>
        <input 
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full bg-black/40 border border-[var(--color-border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
          style={{ colorScheme: "dark" }}
        />
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={isPending || !title || !goal}
          className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white h-12 text-lg"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Synthesize Roadmap"}
        </Button>
      </div>
    </form>
  );
}

function RoadmapCard({ roadmap }: { roadmap: any }) {
  const isGenerating = roadmap.status === "generating";
  
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col group relative"
    >
      {isGenerating && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
          <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mb-4" />
          <div className="text-sm font-medium text-white tracking-widest uppercase">AI is analyzing context</div>
        </div>
      )}
      
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 bg-[var(--color-accent)]/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/70">
            {roadmap.status}
          </div>
        </div>
        
        <h3 className="text-xl font-medium text-white mb-2 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
          {roadmap.title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 line-clamp-2">
          {roadmap.goal}
        </p>

        {roadmap.target_date && (
          <div className="flex items-center text-sm text-[var(--color-text-muted)] mb-4">
            <Clock className="w-4 h-4 mr-2" />
            Target: {new Date(roadmap.target_date).toLocaleDateString()}
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 border-t border-[var(--color-border)] bg-black/20 flex justify-between items-center group-hover:bg-[var(--color-accent)]/5 transition-colors">
        <div className="text-sm font-medium text-[var(--color-text-secondary)]">
          {roadmap.nodes?.length || 0} Milestones
        </div>
        <Link href={`/dashboard/roadmaps/${roadmap.id}`}>
          <Button variant="ghost" size="sm" className="text-[var(--color-accent)] hover:text-white hover:bg-[var(--color-accent)] p-0 w-8 h-8 rounded-full">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
