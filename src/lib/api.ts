import { getToken } from '../hooks/useAuth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
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

// ── Account ────────────────────────────────────────────────────────────────

/**
 * 계정 및 모든 관련 데이터 영구 삭제. ⚠️ 되돌릴 수 없음.
 * 서버가 비밀번호를 재확인한다.
 */
export const deleteAccount = (password: string) =>
  request<{ message: string }>('/api/auth/me', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });

// ── Books ──────────────────────────────────────────────────────────────────

export const getBooks = (params?: { tag?: string; search?: string; lang?: string; offset?: number }) => {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params).filter(([, v]) => v) as string[][],
      ).toString()
    : '';
  return request<any[]>(`/api/books${qs}`);
};

export const getFeaturedBooks = (lang: string, count = 1) =>
  request<any[]>(`/api/books/featured?lang=${lang}&count=${count}`);

export const getBook = (id: string) => request<any>(`/api/books/${id}`);

export const getBookEnrich = (id: string, title: string, author: string) =>
  request<any>(`/api/books/${id}/enrich?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`);


export const getBookReflections = (bookId: string) =>
  request<any[]>(`/api/books/${bookId}/reflections`);

// ── Reflections ────────────────────────────────────────────────────────────

export const getReflections = (params?: { bookId?: string; limit?: number }) => {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null) as string[][]
      ).toString()
    : '';
  return request<any[]>(`/api/reflections${qs}`);
};

// ── BookShelf ──────────────────────────────────────────────────────────────

export const getBookShelf = () => request<any[]>('/api/bookshelf');

export const addToBookShelf = (payload: {
  bookId: string; bookTitle: string; bookAuthor: string; bookCover?: string;
}) => request<any>('/api/bookshelf', { method: 'POST', body: JSON.stringify(payload) });

export const removeFromBookShelf = (bookId: string) =>
  request<any>(`/api/bookshelf/${encodeURIComponent(bookId)}`, { method: 'DELETE' });

// ── Journal ────────────────────────────────────────────────────────────────

export const getJournalEntries = (params?: { bookId?: string }) => {
  const qs = params?.bookId ? `?bookId=${encodeURIComponent(params.bookId)}` : '';
  return request<any[]>(`/api/journal${qs}`);
};

export const getJournalEntry = (id: string) => request<any>(`/api/journal/${id}`);

export const createJournalEntry = (payload: {
  content: string;
  prompt: string | null;
  mood: string | null;
  emotions: string[];
  intensity: number;
  bookId: string | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  bookCover: string | null;
  highlight: string | null;
  isPublic: boolean;
}) => request<any>('/api/journal', { method: 'POST', body: JSON.stringify(payload) });

export const updateJournalEntry = (
  id: string,
  payload: {
    content: string;
    mood: string;
    emotions?: string[];
    intensity: number;
    highlight?: string | null;
    isPublic?: boolean;
  },
) => request<any>(`/api/journal/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteJournalEntry = (id: string) =>
  request<any>(`/api/journal/${id}`, { method: 'DELETE' });

// ── Emotions ───────────────────────────────────────────────────────────────

export const getEmotions = () => request<any[]>('/api/emotions');

export const getEmotionSummary = () => request<any>('/api/emotions/summary');

// ── Insights / Profile ────────────────────────────────────────────────────

export const getUserProfile = () => request<any>('/api/insights/profile');

// ── GPT Questions ─────────────────────────────────────────────────────────

export const getReflectionQuestions = (params: {
  bookId?: string;
  bookTitle: string;
  bookAuthor: string;
  lang?: string;
}) =>
  request<any>('/api/insights/questions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
