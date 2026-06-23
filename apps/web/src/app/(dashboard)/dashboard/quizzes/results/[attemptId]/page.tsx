"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuizResult } from "@/hooks/use-quizzes";
import { Loader2, ArrowLeft, Award, Target, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function QuizResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const { data: result, isLoading } = useQuizResult(resolvedParams.attemptId);

  useEffect(() => {
    if (result && result.percentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#ffffff']
      });
    }
  }, [result]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (!result) return <div>Result not found</div>;

  const getMessage = (pct: number) => {
    if (pct >= 90) return "Outstanding! You have mastered this topic.";
    if (pct >= 70) return "Great job! You have a solid understanding.";
    if (pct >= 50) return "Good effort. Review the material to improve.";
    return "Needs review. We recommend reading the source document again.";
  };

  const getColor = (pct: number) => {
    if (pct >= 80) return "text-green-400";
    if (pct >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      <Link href="/dashboard/quizzes">
        <Button variant="ghost" className="mb-8 text-[var(--color-text-secondary)] hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes
        </Button>
      </Link>

      <div className="glass border border-[var(--color-border)] rounded-3xl p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)]" />
        
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-24 h-24 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Award className={`w-12 h-12 ${getColor(result.percentage)}`} />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-4 font-display">Assessment Complete</h1>
          <p className="text-xl text-[var(--color-text-secondary)]">{getMessage(result.percentage)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-black/20 rounded-2xl p-6 border border-[var(--color-border)] text-center">
            <Target className="w-8 h-8 text-[var(--color-accent)] mx-auto mb-4" />
            <div className="text-3xl font-bold text-white mb-1">{result.percentage}%</div>
            <div className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Score</div>
          </div>
          
          <div className="bg-black/20 rounded-2xl p-6 border border-[var(--color-border)] text-center">
            <BarChart3 className="w-8 h-8 text-[var(--color-accent)] mx-auto mb-4" />
            <div className="text-3xl font-bold text-white mb-1">{result.correct_answers} / {result.total_questions}</div>
            <div className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Correct</div>
          </div>
          
          <div className="bg-black/20 rounded-2xl p-6 border border-[var(--color-border)] text-center">
            <Clock className="w-8 h-8 text-[var(--color-accent)] mx-auto mb-4" />
            <div className="text-3xl font-bold text-white mb-1">{Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s</div>
            <div className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Time Taken</div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-8">
            Your results have been synchronized with your AI Tutor and Topic Mastery records.
          </p>
          <Link href="/dashboard/quizzes">
            <Button size="lg" className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white px-12">
              Continue Learning
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
