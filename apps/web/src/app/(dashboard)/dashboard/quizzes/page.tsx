"use client";

import { useState } from "react";
import { useQuizzes, useGenerateQuiz } from "@/hooks/use-quizzes";
import { useCourses } from "@/hooks/use-courses";
import { useDocuments } from "@/hooks/use-documents";
import { Loader2, Plus, BrainCircuit, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function QuizzesPage() {
  const { data: quizzes = [], isLoading } = useQuizzes();
  const { data: courses = [] } = useCourses();
  const { data: documents = [] } = useDocuments();
  
  const { mutate: generateQuiz, isPending: isGenerating } = useGenerateQuiz();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [courseId, setCourseId] = useState("none");
  const [documentId, setDocumentId] = useState("none");
  const [qCount, setQCount] = useState("5");

  const handleGenerate = () => {
    generateQuiz({
      title,
      difficulty,
      course_id: courseId !== "none" ? courseId : null,
      document_id: documentId !== "none" ? documentId : null,
      question_count: parseInt(qCount),
      question_types: ["multiple_choice", "true_false"]
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setTitle("");
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-display flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-[var(--color-accent)]" />
            Adaptive Assessments
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg">
            Generate grounded quizzes from your uploaded documents to identify weak topics.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Generate Quiz
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] bg-[#1a1b23] border border-[var(--color-border)] text-white">
            <DialogHeader>
              <DialogTitle className="text-xl text-white font-display">Create Assessment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Quiz Title</label>
                <Input 
                  placeholder="e.g. Midterm Prep: Relational Algebra" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-black/20 border-[var(--color-border)] text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-black/20 border-[var(--color-border)]">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1b23] border-[var(--color-border)]">
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Source Document (Optional)</label>
                <Select value={documentId} onValueChange={setDocumentId}>
                  <SelectTrigger className="bg-black/20 border-[var(--color-border)]">
                    <SelectValue placeholder="Select document" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1b23] border-[var(--color-border)]">
                    <SelectItem value="none">Any / General Knowledge</SelectItem>
                    {documents.filter(d => d.status === "ready").map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">Question Count</label>
                <Input 
                  type="number"
                  min="1"
                  max="20"
                  value={qCount} 
                  onChange={(e) => setQCount(e.target.value)}
                  className="bg-black/20 border-[var(--color-border)] text-white"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
              <Button 
                onClick={handleGenerate} 
                disabled={!title || isGenerating}
                className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)]"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                Generate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center p-12 glass border border-[var(--color-border)] rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No quizzes generated yet</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">Create your first quiz to test your knowledge.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={quiz.id}
              className="glass border border-[var(--color-border)] rounded-2xl p-5 hover:border-[var(--color-border-hover)] transition-all flex flex-col group relative overflow-hidden"
            >
              {quiz.status === "generating" && (
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-accent)]/20 overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)] animate-pulse w-1/2 rounded-r-full" />
                </div>
              )}
              
              <h3 className="font-semibold text-white text-xl mb-1">{quiz.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4 capitalize">
                {quiz.difficulty} Difficulty
              </p>
              
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] mb-6">
                <span>{formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true })}</span>
              </div>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-sm">
                  {quiz.status === "ready" ? (
                    <span className="flex items-center text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Ready
                    </span>
                  ) : quiz.status === "generating" ? (
                    <span className="flex items-center text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-full font-medium">
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating
                    </span>
                  ) : (
                    <span className="flex items-center text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Failed
                    </span>
                  )}
                </div>
                
                {quiz.status === "ready" && (
                  <Link href={`/dashboard/quizzes/${quiz.id}`}>
                    <Button variant="ghost" size="sm" className="text-[var(--color-accent)] hover:text-white hover:bg-[var(--color-accent)]/20">
                      <PlayCircle className="w-4 h-4 mr-1.5" /> Take Quiz
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
