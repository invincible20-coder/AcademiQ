"use client";

import { useState, useEffect, useRef } from "react";
import { useConversations, useConversationHistory, useCreateConversation, useDeleteConversation, Conversation } from "@/hooks/use-ai";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Loader2, Plus, MessageSquare, Trash2, Send, Bot, User, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function AIPage() {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { data: conversations = [], isLoading: isLoadingConvs } = useConversations();
  const { data: history = [], isLoading: isLoadingHistory } = useConversationHistory(activeConvId);
  const { mutateAsync: createConv, isPending: isCreating } = useCreateConversation();
  const { mutate: deleteConv } = useDeleteConversation();
  
  const { messages, isLoading: isStreaming, sendMessage, setInitialMessages, error } = useChatStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync loaded history to the stream hook when active conversation changes
  useEffect(() => {
    if (history) {
      setInitialMessages(history);
    }
  }, [history, setInitialMessages, activeConvId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Select newest conv on load if none selected
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const handleNewChat = async () => {
    const conv = await createConv({ title: "New Conversation" });
    setActiveConvId(conv.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    let convId = activeConvId;
    if (!convId) {
      const conv = await createConv({ title: input.substring(0, 30) + "..." });
      convId = conv.id;
      setActiveConvId(conv.id);
    }

    const currentInput = input;
    setInput("");
    await sendMessage(convId, currentInput);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] max-h-[800px] border border-[var(--color-border)] rounded-2xl overflow-hidden glass-strong shadow-2xl relative">
      
      {/* Mobile Sidebar Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden absolute top-4 left-4 z-50 text-[var(--color-text-secondary)] hover:text-white"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] flex flex-col absolute md:relative z-40 h-full glass-strong md:bg-transparent"
          >
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="font-semibold text-white ml-8 md:ml-0 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                Conversations
              </h2>
            </div>
            
            <div className="p-3">
              <Button onClick={handleNewChat} disabled={isCreating} className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white shadow-lg justify-start">
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                New Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
              {isLoadingConvs ? (
                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" /></div>
              ) : conversations.length === 0 ? (
                <div className="text-sm text-center text-[var(--color-text-muted)] mt-10">No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <div 
                    key={conv.id} 
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeConvId === conv.id ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'}`}
                    onClick={() => { setActiveConvId(conv.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="text-sm truncate font-medium">{conv.title}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-6 h-6 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); deleteConv(conv.id); if(activeConvId===conv.id) setActiveConvId(null); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[rgba(0,0,0,0.2)] relative min-w-0">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
          {isLoadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/20 flex items-center justify-center mb-6 border border-[var(--color-accent)]/30">
                <Sparkles className="w-8 h-8 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-display">AcademIQ Tutor</h2>
              <p className="text-[var(--color-text-secondary)] text-sm mb-8">
                I'm your context-aware academic coach. I know about your schedule, tasks, habits, and courses. How can I help you today?
              </p>
              
              <div className="grid grid-cols-1 gap-3 w-full">
                {[
                  "What should I focus on studying today?",
                  "Can you explain database normalization?",
                  "Am I falling behind on any tasks?"
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => { setInput(suggestion); }}
                    className="p-3 text-sm text-left rounded-xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[var(--color-border-hover)] transition-colors text-[var(--color-text-secondary)] hover:text-white"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0 border border-[var(--color-accent)]/30 mt-1">
                      <Bot className="w-4 h-4 text-[var(--color-accent)]" />
                    </div>
                  )}
                  
                  <div className={`px-5 py-3.5 rounded-2xl max-w-[85%] text-[0.95rem] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[var(--color-accent)] text-white rounded-br-sm' 
                      : 'bg-[rgba(255,255,255,0.05)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-sm markdown-body'
                  }`}>
                    {msg.role === 'assistant' ? (
                      msg.content ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <span className="animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span><span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span><span className="w-1.5 h-1.5 bg-white/50 rounded-full"></span></span>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {error && (
                <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Box */}
        <div className="p-4 md:p-6 pt-0">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-end gap-2 bg-[rgba(255,255,255,0.03)] border border-[var(--color-border)] rounded-2xl p-2 focus-within:border-[var(--color-accent)] transition-colors shadow-lg">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message AcademIQ..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
              disabled={isStreaming}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isStreaming}
              className={`rounded-xl shrink-0 transition-all ${input.trim() ? 'bg-[var(--color-accent)] text-white' : 'bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)]'}`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-center mt-2 text-xs text-[var(--color-text-muted)]">
            AcademIQ uses your tasks, schedule, and habits to personalize responses.
          </div>
        </div>

      </div>
    </div>
  );
}
