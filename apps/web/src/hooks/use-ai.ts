import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";
import { ChatMessage } from "./use-chat-stream";

export interface Conversation {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  const { getToken } = useAuth();
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const token = await getToken();
      return createApiClient(token).ai.listConversations();
    }
  });
}

export function useConversationHistory(id: string | null) {
  const { getToken } = useAuth();
  return useQuery<ChatMessage[]>({
    queryKey: ["conversations", id, "messages"],
    queryFn: async () => {
      if (!id) return [];
      const token = await getToken();
      return createApiClient(token).ai.getConversation(id);
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, course_id }: { title: string; course_id?: string }) => {
      const token = await getToken();
      return createApiClient(token).ai.createConversation(title, course_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
}

export function useDeleteConversation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return createApiClient(token).ai.deleteConversation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
}
