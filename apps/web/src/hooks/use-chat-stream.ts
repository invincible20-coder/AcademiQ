import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const setInitialMessages = useCallback((initial: ChatMessage[]) => {
    setMessages(initial);
  }, []);

  const sendMessage = async (conversationId: string, content: string) => {
    if (!content.trim()) return;

    // Optimistically add user message
    const tempUserId = `temp-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempUserId,
      role: "user",
      content,
      created_at: new Date().toISOString()
    };
    
    // Optimistically add empty assistant message
    const tempAsstId = `temp-asst-${Date.now()}`;
    const asstMsg: ChatMessage = {
      id: tempAsstId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg, asstMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      
      const response = await fetch(`http://localhost:8000/api/ai/chat/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let isDone = false;
      let fullContent = "";

      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) {
          isDone = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              isDone = true;
              break;
            }
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                setError(data.error);
                isDone = true;
                break;
              }
              if (data.chunk) {
                fullContent += data.chunk;
                // Update assistant message with streaming content
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const idx = newMsgs.findIndex(m => m.id === tempAsstId);
                  if (idx !== -1) {
                    newMsgs[idx] = { ...newMsgs[idx], content: fullContent };
                  }
                  return newMsgs;
                });
              }
            } catch (e) {
              console.error("Error parsing SSE data", e, dataStr);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    setInitialMessages
  };
}
