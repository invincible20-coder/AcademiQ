"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuizDetail, useStartAttempt, useSubmitAttempt } from "@/hooks/use-quizzes";
import { Loader2, ArrowRight, BrainCircuit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const { data: quizData, isLoading: isLoadingQuiz } = useQuizDetail(resolvedParams.id);
  const { mutateAsync: startAttempt, isPending: isStarting } = useStartAttempt();
  const { mutateAsync: submitAttempt, isPending: isSubmitting } = useSubmitAttempt();
  
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      const attempt = await startAttempt(resolvedParams.id);
      setAttemptId(attempt.id);
      setIsStarted(true);
    } catch (e) {
      console.error("Failed to start attempt", e);
    }
  };

  const handleNext = async () => {
    if (!quizData) return;
    
    const currentQ = quizData.questions[currentIdx];
    
    const newAnswers = [
      ...answers,
      {
        question_id: currentQ.id,
        user_answer: selectedOption || "",
        confidence_score: 5 // Default for now
      }
    ];
    setAnswers(newAnswers);
    setSelectedOption(null);
    
    if (currentIdx < quizData.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Submit
      if (!attemptId) return;
      try {
        const result = await submitAttempt({ attemptId, answers: newAnswers });
        router.push(`/dashboard/quizzes/results/${result.attempt_id}`);
      } catch (e) {
        console.error("Failed to submit", e);
      }
    }
  };

  if (isLoadingQuiz) {
    return (
      <div className="flex justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (!quizData) return <div>Quiz not found</div>;

  const { quiz, questions } = quizData;

  if (!isStarted) {
    return (
      <div className="max-w-3xl mx-auto mt-12 animate-fade-in">
        <div className="glass border border-[var(--color-border)] rounded-2xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BrainCircuit className="w-10 h-10 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 font-display">{quiz.title}</h1>
          <p className="text-[var(--color-text-secondary)] mb-8 max-w-lg mx-auto">
            {quiz.description || "Test your knowledge and get a personalized topic mastery score. Your answers will be used to calibrate your AI Tutor."}
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-12">
            <div className="text-center">
              <div className="text-2xl font-semibold text-white">{questions.length}</div>
              <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Questions</div>
            </div>
            <div className="w-px h-10 bg-[var(--color-border)]" />
            <div className="text-center">
              <div className="text-2xl font-semibold text-white capitalize">{quiz.difficulty}</div>
              <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Level</div>
            </div>
          </div>
          
          <Button 
            onClick={handleStart} 
            disabled={isStarting}
            size="lg"
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white w-full sm:w-auto px-12"
          >
            {isStarting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Start Assessment"}
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-medium text-[var(--color-text-secondary)] font-display">
          Question {currentIdx + 1} <span className="text-[var(--color-text-muted)]">of {questions.length}</span>
        </h2>
        <Button variant="ghost" className="text-[var(--color-text-muted)] hover:text-white" onClick={() => router.push("/dashboard/quizzes")}>
          Quit Assessment
        </Button>
      </div>
      
      <Progress value={progress} className="h-2 mb-12 bg-black/40" indicatorClassName="bg-[var(--color-accent)]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass border border-[var(--color-border)] rounded-2xl p-8 md:p-12 mb-8"
        >
          <h3 className="text-2xl font-medium text-white mb-8 leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="space-y-3">
            {currentQ.question_type === "multiple_choice" || currentQ.question_type === "true_false" ? (
              Object.entries(currentQ.options || {}).map(([key, val]) => (
                <div 
                  key={key}
                  onClick={() => setSelectedOption(key)}
                  className={`
                    p-5 rounded-xl border cursor-pointer transition-all flex items-center group
                    ${selectedOption === key 
                      ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]' 
                      : 'bg-black/20 border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-black/40'
                    }
                  `}
                >
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors
                    ${selectedOption === key ? 'border-[var(--color-accent)] bg-[var(--color-accent)]' : 'border-[var(--color-text-muted)] group-hover:border-[var(--color-text-secondary)]'}
                  `}>
                    {selectedOption === key && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-white text-lg">{val as string}</span>
                </div>
              ))
            ) : (
              <textarea 
                className="w-full bg-black/20 border border-[var(--color-border)] rounded-xl p-4 text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                rows={5}
                placeholder="Type your answer here..."
                value={selectedOption || ""}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end">
        <Button 
          onClick={handleNext}
          disabled={!selectedOption || isSubmitting}
          size="lg"
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : currentIdx === questions.length - 1 ? (
            <>Submit Assessment <CheckCircle2 className="w-5 h-5 ml-2" /></>
          ) : (
            <>Next Question <ArrowRight className="w-5 h-5 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
