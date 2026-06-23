import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** Typed fetch wrapper with Clerk JWT auth and error handling. */
async function apiFetch<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
  isMultipart = false
): Promise<T> {
  const headers: Record<string, string> = { ...options.headers as Record<string, string> };
  
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail ?? `API error ${res.status}`);
  }

  return res.json();
}

/** Creates an SSE stream from an agent endpoint. */
export async function* streamAgent(
  path: string,
  token: string | null,
  body: Record<string, unknown>
): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Agent request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === "chunk") yield parsed.content;
          if (parsed.type === "done") return;
          if (parsed.type === "error") throw new Error(parsed.message);
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }
}

// ── API Clients ───────────────────────────────────────────────────────────────

export const createApiClient = (token: string | null) => ({
  courses: {
    list: (params?: { search?: string; semester?: string; archived?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.append("search", params.search);
      if (params?.semester) qs.append("semester", params.semester);
      if (params?.archived !== undefined) qs.append("archived", String(params.archived));
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return apiFetch(`/courses/${query}`, token);
    },
    get: (id: string) => apiFetch(`/courses/${id}`, token),
    create: (data: unknown) => apiFetch("/courses/", token, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch(`/courses/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
    archive: (id: string) => apiFetch(`/courses/${id}/archive`, token, { method: "PATCH" }),
    delete: (id: string) => apiFetch(`/courses/${id}`, token, { method: "DELETE" }),
  },
  schedule: {
    list: (params?: { start_date?: string; end_date?: string; course_id?: string; event_type?: string }) => {
      const qs = new URLSearchParams();
      if (params?.start_date) qs.append("start_date", params.start_date);
      if (params?.end_date) qs.append("end_date", params.end_date);
      if (params?.course_id) qs.append("course_id", params.course_id);
      if (params?.event_type) qs.append("event_type", params.event_type);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return apiFetch(`/schedule/${query}`, token);
    },
    get: (id: string) => apiFetch(`/schedule/${id}`, token),
    create: (data: unknown) => apiFetch("/schedule/", token, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch(`/schedule/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/schedule/${id}`, token, { method: "DELETE" }),
    duplicate: (id: string) => apiFetch(`/schedule/${id}/duplicate`, token, { method: "PATCH" }),
  },
  ai: {
    listConversations: () => apiFetch("/ai/conversations", token),
    getConversation: (id: string) => apiFetch(`/ai/conversations/${id}`, token),
    createConversation: (title: string, course_id?: string) => apiFetch("/ai/conversations", token, { method: "POST", body: JSON.stringify({ title, course_id }) }),
    renameConversation: (id: string, title: string) => apiFetch(`/ai/conversations/${id}`, token, { method: "PATCH", body: JSON.stringify({ title }) }),
    deleteConversation: (id: string) => apiFetch(`/ai/conversations/${id}`, token, { method: "DELETE" }),
  },
  documents: {
    list: (course_id?: string) => apiFetch(`/documents/${course_id ? `?course_id=${course_id}` : ""}`, token),
    upload: (formData: FormData) => apiFetch("/documents/upload", token, { method: "POST", body: formData }, true),
    delete: (id: string) => apiFetch(`/documents/${id}`, token, { method: "DELETE" }),
  },
  quizzes: {
    generate: (data: unknown) => apiFetch("/quizzes/generate", token, { method: "POST", body: JSON.stringify(data) }),
    list: () => apiFetch("/quizzes/", token),
    get: (id: string) => apiFetch(`/quizzes/${id}`, token),
    getResult: (attemptId: string) => apiFetch(`/quizzes/attempts/${attemptId}`, token),
    startAttempt: (id: string) => apiFetch(`/quizzes/${id}/attempts`, token, { method: "POST", body: JSON.stringify({}) }),
    submitAttempt: (attemptId: string, answers: unknown) => apiFetch(`/quizzes/attempts/${attemptId}/submit`, token, { method: "POST", body: JSON.stringify({ answers }) })
  },
  roadmaps: {
    generate: (data: unknown) => apiFetch("/roadmaps/generate", token, { method: "POST", body: JSON.stringify(data) }),
    list: () => apiFetch("/roadmaps/", token),
    get: (id: string) => apiFetch(`/roadmaps/${id}`, token),
    updateProgress: (nodeId: string, completion_percentage: number) => apiFetch(`/roadmaps/nodes/${nodeId}/progress`, token, { method: "PATCH", body: JSON.stringify({ completion_percentage }) }),
    recalculate: (id: string) => apiFetch(`/roadmaps/${id}/recalculate`, token, { method: "POST", body: JSON.stringify({}) })
  },
  assignments: {
    list: (status?: string) => apiFetch(`/assignments/${status ? `?status_filter=${status}` : ""}`, token),
    create: (data: unknown) => apiFetch("/assignments/", token, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch(`/assignments/${id}`, token, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/assignments/${id}`, token, { method: "DELETE" }),
  },
  habits: {
    list: () => apiFetch("/habits/", token),
    create: (data: unknown) => apiFetch("/habits/", token, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch(`/habits/${id}`, token, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/habits/${id}`, token, { method: "DELETE" }),
    log: (habitId: string, data: unknown) => apiFetch(`/habits/${habitId}/log`, token, { method: "POST", body: JSON.stringify(data) }),
    getLogs: (habitId: string) => apiFetch(`/habits/${habitId}/logs`, token),
  },
  tasks: {
    list: () => apiFetch("/tasks", token),
    create: (data: unknown) => apiFetch("/tasks", token, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => apiFetch(`/tasks/${id}`, token, { method: "PUT", body: JSON.stringify(data) }),
    toggleComplete: (id: string) => apiFetch(`/tasks/${id}/complete`, token, { method: "PATCH" }),
    delete: (id: string) => apiFetch(`/tasks/${id}`, token, { method: "DELETE" }),
  },
  agents: {
    streamAnalyze: (body: Record<string, unknown>) => streamAgent("/agents/analyze", token, body),
    streamRoadmap: (body: Record<string, unknown>) => streamAgent("/agents/roadmap", token, body),
    streamTutor: (body: Record<string, unknown>) => streamAgent("/agents/tutor", token, body),
    streamQuiz: (body: Record<string, unknown>) => streamAgent("/agents/quiz/generate", token, body),
    streamResources: (body: Record<string, unknown>) => streamAgent("/agents/resources", token, body),
    streamRAG: (body: Record<string, unknown>) => streamAgent("/agents/rag/query", token, body),
    getDailyCoaching: () => streamAgent("/agents/coach/daily", token, {}),
  },
});
