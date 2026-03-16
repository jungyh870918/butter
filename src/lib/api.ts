import { Book, Reflection, JournalEntry, EmotionData } from '../types';

const API_BASE_URL = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Books
  getBooks: (params?: { tag?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.tag && params.tag !== 'All') query.append('tag', params.tag);
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return request<Book[]>(`/api/books${queryString ? `?${queryString}` : ''}`);
  },
  getBook: (id: string) => request<Book>(`/api/books/${id}`),
  getBookReflections: (bookId: string) => request<Reflection[]>(`/api/books/${bookId}/reflections`),

  // Reflections
  getReflections: (params?: { bookId?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.bookId) query.append('bookId', params.bookId);
    if (params?.limit) query.append('limit', params.limit.toString());
    const queryString = query.toString();
    return request<Reflection[]>(`/api/reflections${queryString ? `?${queryString}` : ''}`);
  },
  getReflection: (id: string) => request<Reflection>(`/api/reflections/${id}`),
  createReflection: (payload: Partial<Reflection>) => request<Reflection>('/api/reflections', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Journal
  getJournalEntries: () => request<JournalEntry[]>('/api/journal'),
  createJournalEntry: (payload: Partial<JournalEntry>) => request<JournalEntry>('/api/journal', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateJournalEntry: (id: string, payload: Partial<JournalEntry>) => request<JournalEntry>(`/api/journal/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteJournalEntry: (id: string) => request<void>(`/api/journal/${id}`, {
    method: 'DELETE',
  }),

  // Emotions
  getEmotions: () => request<EmotionData[]>('/api/emotions'),
  getEmotionSummary: () => request<{ topEmotions: string[]; averageIntensity: number }>('/api/emotions/summary'),
  createEmotionLog: (payload: EmotionData) => request<EmotionData>('/api/emotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};
