import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";

export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom";

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  icon: string | null;
  color: string | null;
  is_active: boolean;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note: string | null;
}

export function useHabits() {
  const { getToken } = useAuth();
  
  return useQuery<Habit[]>({
    queryKey: ["habits"],
    queryFn: async () => {
      const token = await getToken();
      const res = await createApiClient(token).habits.list();
      return (res as any).items || [];
    },
  });
}

export function useCreateHabit() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Habit>) => {
      const token = await getToken();
      return createApiClient(token).habits.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useUpdateHabit() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Habit> }) => {
      const token = await getToken();
      return createApiClient(token).habits.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useDeleteHabit() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return createApiClient(token).habits.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useHabitLogs(habitId: string) {
  const { getToken } = useAuth();

  return useQuery<HabitLog[]>({
    queryKey: ["habits", habitId, "logs"],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).habits.getLogs(habitId);
    },
    enabled: !!habitId,
  });
}

export function useLogHabit() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) => {
      const token = await getToken();
      return createApiClient(token).habits.log(habitId, { date, completed });
    },
    onMutate: async ({ habitId, date, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["habits", habitId, "logs"] });
      const previousLogs = queryClient.getQueryData<HabitLog[]>(["habits", habitId, "logs"]);
      
      if (previousLogs) {
        queryClient.setQueryData<HabitLog[]>(["habits", habitId, "logs"], old => {
          if (!old) return old;
          const exists = old.find(l => l.date === date);
          if (exists) {
            return old.map(l => l.date === date ? { ...l, completed } : l);
          } else {
            return [{ id: "temp", habit_id: habitId, date, completed, note: null }, ...old];
          }
        });
      }
      return { previousLogs, habitId };
    },
    onError: (err, variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(["habits", context.habitId, "logs"], context.previousLogs);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["habits", variables.habitId, "logs"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] }); // Re-fetch all habits (to update overall stats if needed)
    },
  });
}
