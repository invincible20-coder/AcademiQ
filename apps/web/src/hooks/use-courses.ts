import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";

export interface Course {
  id: string;
  course_name: string;
  course_code: string | null;
  description: string | null;
  instructor: string | null;
  semester: string | null;
  credits: number | null;
  color_theme: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export function useCourses(params?: { search?: string; semester?: string; archived?: boolean }) {
  const { getToken } = useAuth();
  
  return useQuery<Course[]>({
    queryKey: ["courses", params],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).courses.list(params);
    },
  });
}

export function useCourse(id: string) {
  const { getToken } = useAuth();
  
  return useQuery<Course>({
    queryKey: ["courses", id],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).courses.get(id);
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Course>) => {
      const token = await getToken();
      return createApiClient(token).courses.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUpdateCourse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Course> }) => {
      const token = await getToken();
      return createApiClient(token).courses.update(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", variables.id] });
    },
  });
}

export function useArchiveCourse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return createApiClient(token).courses.archive(id);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses", variables] });
    },
  });
}

export function useDeleteCourse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return createApiClient(token).courses.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
