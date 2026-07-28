import { useState, useEffect, useCallback } from 'react';
import { JournalEntry } from '../types';
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '../lib/api';

// enabled 패턴 제거 — 항상 마운트 시 fetch
// Reflection 생성, EmotionLog 기록은 백엔드 journal POST/PATCH에서 처리
export function useJournal(bookId?: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEntries = useCallback(() => {
    setLoading(true);
    setError('');
    getJournalEntries(bookId ? { bookId } : undefined)
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const create = async (payload: {
    content: string;
    prompt: string;
    mood: string;
    emotions?: string[];
    intensity: number;
    highlight?: string | null;
    bookId?: string | null;
    bookTitle?: string | null;
    bookAuthor?: string | null;
    bookCover?: string | null;
  }): Promise<{ id: string }> => {
    const entry = await createJournalEntry({
      content: payload.content,
      prompt: payload.prompt,
      mood: payload.mood || null,
      emotions: payload.emotions ?? [],
      intensity: payload.intensity,
      bookId: payload.bookId ?? null,
      bookTitle: payload.bookTitle ?? null,
      bookAuthor: payload.bookAuthor ?? null,
      bookCover: payload.bookCover ?? null,
      highlight: payload.highlight ?? null,
      // ⚠️ 커뮤니티 노출을 제거했으므로 항상 비공개.
      //    Prisma 스키마 기본값이 true 라 생략하면 공개글(Reflection)이 계속 생성된다.
      isPublic: false,
    });

    // 로컬 상태에 즉시 추가
    setEntries((prev) => [entry, ...prev]);

    return entry;
  };

  const update = async (
    id: string,
    payload: {
      content: string;
      mood: string;
      emotions?: string[];
      intensity: number;
      highlight?: string | null;
    },
  ) => {
    await updateJournalEntry(id, { ...payload, isPublic: false });
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...payload } : e)),
    );
  };

  const remove = async (id: string) => {
    await deleteJournalEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return { entries, loading, error, create, update, remove, refetch: fetchEntries };
}
