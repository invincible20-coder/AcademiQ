"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Bot, Send, User, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Explain recursion with a simple example",
  "What's the difference between TCP and UDP?",
  "How does gradient descent work?",
  "Explain the CAP theorem",
  "What is Big O notation?",
];

export default function TutorPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState("General");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const token = await getToken();
        const api = createApiClient(token);

        const stream = api.agents.streamTutor({
          question: text,
          topic,
          context: messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n"),
          knowledge_level: "intermediate",
        });

        let fullContent = "";
        for await (const chunk of stream) {
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: fullContent, streaming: true }
                : m
            )
          );
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, streaming: false } : m
          )
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "Sorry, I encountered an error. Please try again.", streaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [getToken, isLoading, messages, topic]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            AI Tutor
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Ask anything — I adapt to your level
          </p>
        </div>

        {/* Topic selector */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic..."
            className="bg-[rgba(255,255,255,0.05)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] w-32"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center gap-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg glow-purple">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                What would you like to learn today?
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                I explain concepts clearly, use analogies, and adapt to your level.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-3 rounded-xl glass border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[rgba(124,58,237,0.05)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white"
                      : "glass border border-[var(--color-border)] text-[var(--color-text-primary)]"
                  )}
                >
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                  {msg.streaming && msg.content && (
                    <span className="ai-cursor" />
                  )}
                  {msg.streaming && !msg.content && (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-accent-light)]" />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 glass rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-accent)] transition-colors duration-200 p-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none max-h-32 overflow-y-auto"
          style={{ minHeight: "24px" }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
