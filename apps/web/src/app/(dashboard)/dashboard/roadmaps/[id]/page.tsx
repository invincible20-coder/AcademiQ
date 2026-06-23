"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRoadmapDetail, useUpdateNodeProgress, useRecalculateRoadmap } from "@/hooks/use-roadmaps";
import { Loader2, ArrowLeft, CheckCircle2, Circle, RefreshCw, AlertCircle, BookOpen, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export default function RoadmapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: roadmap, isLoading } = useRoadmapDetail(resolvedParams.id);
  const { mutateAsync: updateProgress } = useUpdateNodeProgress();
  const { mutateAsync: recalculate, isPending: isRecalculating } = useRecalculateRoadmap();

  const [togglingNodeId, setTogglingNodeId] = useState<string | null>(null);

  if (isLoading || !roadmap) {
    return (
      <div className="flex justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (roadmap.status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center p-32 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-accent)] mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Architecting your path...</h2>
        <p className="text-[var(--color-text-secondary)]">
          We are analyzing your mastery scores, courses, and goals to build the perfect roadmap.
        </p>
      </div>
    );
  }

  // Calculate overall progress
  const totalNodes = roadmap.nodes.length;
  const completedNodes = roadmap.nodes.filter(n => n.status === "completed").length;
  const overallProgress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  const handleToggleNode = async (nodeId: string, currentStatus: string) => {
    setTogglingNodeId(nodeId);
    try {
      const newPercentage = currentStatus === "completed" ? 0 : 100;
      await updateProgress({ nodeId, percentage: newPercentage });
    } finally {
      setTogglingNodeId(null);
    }
  };

  const handleRecalculate = async () => {
    try {
      await recalculate(roadmap.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link href="/dashboard/roadmaps">
        <Button variant="ghost" className="mb-6 text-[var(--color-text-secondary)] hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Roadmaps
        </Button>
      </Link>

      <div className="glass border border-[var(--color-border)] rounded-3xl p-8 md:p-12 mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-display">{roadmap.title}</h1>
            <p className="text-[var(--color-text-secondary)] max-w-2xl">{roadmap.goal}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="border-[var(--color-border)] text-white hover:bg-white/5"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
        </div>

        <div className="bg-black/20 rounded-2xl p-6 border border-[var(--color-border)]">
          <div className="flex justify-between text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            <span>Overall Progress</span>
            <span className="text-white">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3 bg-black/40" indicatorClassName="bg-[var(--color-accent)]" />
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--color-accent)] before:via-[var(--color-border)] before:to-transparent">
        {roadmap.nodes.map((node, idx) => {
          const isCompleted = node.status === "completed";
          const isHighPriority = node.priority === "high";

          return (
            <div key={node.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              {/* Icon / Marker */}
              <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-[#0a0a0a] bg-black shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 z-10 transition-colors">
                <button 
                  onClick={() => handleToggleNode(node.id, node.status)}
                  disabled={togglingNodeId === node.id}
                  className="focus:outline-none"
                >
                  {togglingNodeId === node.id ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-7 h-7 text-[var(--color-accent)]" />
                  ) : (
                    <Circle className="w-7 h-7 text-[var(--color-border-hover)] hover:text-white transition-colors" />
                  )}
                </button>
              </div>

              {/* Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass border ${isCompleted ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5' : 'border-[var(--color-border)]'} rounded-2xl p-6 ml-16 md:ml-0`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`text-xl font-medium ${isCompleted ? 'text-white/60 line-through' : 'text-white'}`}>
                    {node.title}
                  </h3>
                  {isHighPriority && !isCompleted && (
                    <span className="flex items-center px-2 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded-md uppercase tracking-wider border border-red-500/20">
                      <AlertCircle className="w-3 h-3 mr-1" /> Priority
                    </span>
                  )}
                </div>
                
                <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">
                  {node.description}
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--color-border)]/50">
                  <div className="flex items-center text-xs text-[var(--color-text-muted)]">
                    <Clock className="w-4 h-4 mr-1 text-[var(--color-text-secondary)]" />
                    {node.estimated_hours}h est.
                  </div>
                  <div className="flex items-center text-xs text-[var(--color-text-muted)]">
                    <Target className="w-4 h-4 mr-1 text-[var(--color-text-secondary)]" />
                    Aim: {node.mastery_target}%
                  </div>
                  <div className="flex items-center text-xs text-[var(--color-text-muted)] capitalize">
                    <BookOpen className="w-4 h-4 mr-1 text-[var(--color-text-secondary)]" />
                    {node.difficulty}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
