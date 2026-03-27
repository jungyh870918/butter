const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000';

const TOKEN_KEY = 'butter-token';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ── Books ──────────────────────────────────────────────────────────────────

export const getBooks = (params?: { tag?: string; search?: string; lang?: string }) => {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params).filter(([, v]) => v) as string[][],
      ).toString()
    : '';
  return request<any[]>(`/api/books${qs}`);
};

export const getBook = (id: string) => request<any>(`/api/books/${id}`);

export const getBookEnrich = (id: string, title: string, author: string) =>
  request<any>(`/api/books/${id}/enrich?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`);


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
  bookTitle?: string | null;
  bookAuthor?: string | null;
  userId?: string | null;
  journalEntryId?: string | null;
}) => request<any>('/api/reflections', { method: 'POST', body: JSON.stringify(payload) });

// ── Journal ────────────────────────────────────────────────────────────────

export const getJournalEntries = (params?: { bookId?: string }) => {
  const qs = params?.bookId ? `?bookId=${encodeURIComponent(params.bookId)}` : '';
  return request<any[]>(`/api/journal${qs}`);
};

export const getJournalEntry = (id: string) =>
  request<any>(`/api/journal/${id}`);

export const createJournalEntry = (payload: {
  content: string;
  prompt?: string | null;
  mood?: string | null;
  emotions?: string[];
  intensity: number;
  bookId?: string | null;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  bookCover?: string | null;
  highlight?: string | null;
}) => request<any>('/api/journal', { method: 'POST', body: JSON.stringify(payload) });

export const updateJournalEntry = (
  id: string,
  payload: Partial<{
    content: string;
    prompt: string;
    mood: string;
    emotions: string[];
    intensity: number;
    bookId: string | null;
    bookTitle: string | null;
    bookAuthor: string | null;
    bookCover: string | null;
    highlight: string | null;
  }>,
) => request<any>(`/api/journal/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteJournalEntry = (id: string) =>
  request<any>(`/api/journal/${id}`, { method: 'DELETE' });

// ── Insights (GPT pipeline) ────────────────────────────────────────────────

export const getUserProfile = () =>
  request<any>('/api/insights/profile');

export const refreshUserProfile = () =>
  request<any>('/api/insights/profile', { method: 'POST' });

export const getReflectionQuestions = (payload: {
  bookTitle: string;
  bookAuthor: string;
  bookDescription?: string;
  bookTags?: string[];
}) => request<{
  questions: string[];
  questionsKo: string[];
  meta: { profileUsed: boolean; readingVolumeLevel: string; sourceEntryCount: number };
}>(
  '/api/insights/questions',
  { method: 'POST', body: JSON.stringify(payload) }
);

// ── Emotions ───────────────────────────────────────────────────────────────

export const getEmotions = () => request<any[]>('/api/emotions');

export const getEmotionSummary = () => request<any>('/api/emotions/summary');

export const createEmotionLog = (payload: {
  date: string;
  intensity: number;
  emotion: string;
}) => request<any>('/api/emotions', { method: 'POST', body: JSON.stringify(payload) });
