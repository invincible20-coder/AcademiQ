import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  event_type: "CLASS" | "LAB" | "TUTORIAL" | "EXAM" | "ASSIGNMENT" | "STUDY_SESSION" | "REVISION" | "PERSONAL";
  location: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;
  color_theme: string | null;
  created_at: string;
  updated_at: string;
}

export function useScheduleEvents(params?: { start_date?: string; end_date?: string; course_id?: string; event_type?: string }) {
  const { getToken } = useAuth();
  
  return useQuery<ScheduleEvent[]>({
    queryKey: ["schedule", params],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).schedule.list(params);
    },
  });
}

export function useScheduleEvent(id: string) {
  const { getToken } = useAuth();
  
  return useQuery<ScheduleEvent>({
    queryKey: ["schedule", id],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).schedule.get(id);
    },
    enabled: !!id,
  });
}

export function useCreateScheduleEvent() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ScheduleEvent>) => {
      const token = await getToken();
      return createApiClient(token).schedule.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useUpdateScheduleEvent() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScheduleEvent> }) => {
      const token = await getToken();
      return createApiClient(token).schedule.update(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["schedule", variables.id] });
    },
  });
}

export function useDeleteScheduleEvent() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return createApiClient(token).schedule.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useDuplicateScheduleEvent() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return createApiClient(token).schedule.duplicate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}
