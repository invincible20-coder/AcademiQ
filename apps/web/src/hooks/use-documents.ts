import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";

export interface Document {
  id: string;
  course_id: string | null;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: "processing" | "ready" | "failed";
  created_at: string;
  updated_at: string;
}

export function useDocuments(course_id?: string) {
  const { getToken } = useAuth();
  return useQuery<Document[]>({
    queryKey: ["documents", course_id],
    queryFn: async () => {
      const token = await getToken();
      const res = await createApiClient(token).documents.list(course_id);
      return (res as any).items || [];
    },
    refetchInterval: (query) => {
      // Auto refetch if any documents are processing
      const hasProcessing = query.state.data?.some(d => d.status === "processing");
      return hasProcessing ? 2000 : false;
    }
  });
}

export function useUploadDocument() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, course_id }: { file: File, course_id?: string }) => {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      if (course_id) {
        formData.append("course_id", course_id);
      }
      return createApiClient(token).documents.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  });
}

export function useDeleteDocument() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return createApiClient(token).documents.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  });
}
