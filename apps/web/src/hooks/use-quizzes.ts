import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "generating" | "ready" | "failed";
  course_id: string | null;
  document_id: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question_type: "multiple_choice" | "true_false" | "fill_in_blank" | "short_answer" | "matching";
  question: string;
  options: any | null;
}

export interface QuizDetail {
  quiz: Quiz;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  total_questions: number;
  started_at: string;
}

export interface QuizResult {
  attempt_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
}

export function useQuizzes() {
  const { getToken } = useAuth();
  return useQuery<Quiz[]>({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).quizzes.list();
    },
    refetchInterval: (query) => {
      const hasGenerating = query.state.data?.some(q => q.status === "generating");
      return hasGenerating ? 2000 : false;
    }
  });
}

export function useQuizDetail(id: string) {
  const { getToken } = useAuth();
  return useQuery<QuizDetail>({
    queryKey: ["quizzes", id],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).quizzes.get(id);
    },
    enabled: !!id,
  });
}

export function useQuizResult(attemptId: string) {
  const { getToken } = useAuth();
  return useQuery<QuizResult>({
    queryKey: ["quizzes", "attempts", attemptId],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).quizzes.getResult(attemptId);
    },
    enabled: !!attemptId,
  });
}

export function useGenerateQuiz() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      return createApiClient(token).quizzes.generate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    }
  });
}

export function useStartAttempt() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (quizId: string) => {
      const token = await getToken();
      return createApiClient(token).quizzes.startAttempt(quizId);
    }
  });
}

export function useSubmitAttempt() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ attemptId, answers }: { attemptId: string, answers: any[] }) => {
      const token = await getToken();
      return createApiClient(token).quizzes.submitAttempt(attemptId, answers);
    }
  });
}
