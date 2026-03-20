const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ── Books ──────────────────────────────────────────────────────────────────

export const getBooks = (params?: { tag?: string; search?: string }) => {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params).filter(([, v]) => v) as string[][],
      ).toString()
    : '';
  return request<any[]>(`/api/books${qs}`);
};

export const getBook = (id: string) => request<any>(`/api/books/${id}`);

export const getBookReflections = (bookId: string) =>
  request<any[]>(`/api/books/${bookId}/reflections`);

// ── Reflections ────────────────────────────────────────────────────────────

export const getReflections = (params?: { bookId?: string; limit?: number }) => {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  return request<any[]>(`/api/reflections${qs}`);
};

export const getReflection = (id: string) => request<any>(`/api/reflections/${id}`);

export const createReflection = (payload: {
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  tags: string[];
  image?: string | null;
  bookId?: string | null;
  userId?: string | null;
  journalEntryId?: string | null;
}) => request<any>('/api/reflections', { method: 'POST', body: JSON.stringify(payload) });

// ── Journal ────────────────────────────────────────────────────────────────

export const getJournalEntries = () => request<any[]>('/api/journal');

export const createJournalEntry = (payload: {
  content: string;
  prompt?: string | null;
  mood?: string | null;
  intensity: number;
}) => request<any>('/api/journal', { method: 'POST', body: JSON.stringify(payload) });

export const updateJournalEntry = (
  id: string,
  payload: Partial<{
    content: string;
    prompt: string;
    mood: string;
    intensity: number;
  }>,
) => request<any>(`/api/journal/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteJournalEntry = (id: string) =>
  request<any>(`/api/journal/${id}`, { method: 'DELETE' });

// ── Emotions ───────────────────────────────────────────────────────────────

export const getEmotions = () => request<any[]>('/api/emotions');

export const getEmotionSummary = () => request<any>('/api/emotions/summary');

export const createEmotionLog = (payload: {
  date: string;
  intensity: number;
  emotion: string;
}) => request<any>('/api/emotions', { method: 'POST', body: JSON.stringify(payload) });
