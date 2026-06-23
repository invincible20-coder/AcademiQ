import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";

export interface RoadmapProgress {
  id: string;
  completion_percentage: number;
  last_activity: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  estimated_hours?: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "skipped";
  order_index: number;
  mastery_target: number;
  progress?: RoadmapProgress;
}

export interface LearningRoadmap {
  id: string;
  title: string;
  goal: string;
  target_date?: string;
  status: "generating" | "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
  nodes: RoadmapNode[];
}

export function useRoadmaps() {
  const { getToken } = useAuth();
  return useQuery<LearningRoadmap[]>({
    queryKey: ["roadmaps"],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).roadmaps.list();
    },
  });
}

export function useRoadmapDetail(id: string) {
  const { getToken } = useAuth();
  return useQuery<LearningRoadmap>({
    queryKey: ["roadmaps", id],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).roadmaps.get(id);
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll if generating
      const data = query.state.data as LearningRoadmap | undefined;
      return data?.status === "generating" ? 2000 : false;
    }
  });
}

export function useGenerateRoadmap() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; goal: string; target_date?: string; course_id?: string }) => {
      const token = await getToken();
      return createApiClient(token).roadmaps.generate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
}

export function useUpdateNodeProgress() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nodeId, percentage }: { nodeId: string; percentage: number }) => {
      const token = await getToken();
      return createApiClient(token).roadmaps.updateProgress(nodeId, percentage);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
}

export function useRecalculateRoadmap() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return createApiClient(token).roadmaps.recalculate(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps", id] });
    },
  });
}
