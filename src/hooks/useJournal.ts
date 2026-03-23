import { useState, useEffect, useCallback } from 'react';
import { JournalEntry } from '../types';
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  createEmotionLog,
} from '../lib/api';
import { getWeekdayLabel } from '../lib/format';

export function useJournal(enabled: boolean, bookId?: string) {
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
    if (enabled) fetchEntries();
  }, [enabled, fetchEntries]);

  const create = async (payload: {
    content: string;
    prompt: string;
    mood: string;
    emotions?: string[];
    intensity: number;
    bookId?: string | null;
    bookTitle?: string | null;
    bookAuthor?: string | null;
    bookCover?: string | null;
    highlight?: string | null;
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
    });

    // 감정 로그: emotions 배열이 있으면 각각 기록, 없으면 기존 mood로 fallback
    const emotionsToLog = (payload.emotions ?? []).length > 0
      ? payload.emotions!
      : payload.mood ? [payload.mood] : [];

    for (const emotion of emotionsToLog) {
      await createEmotionLog({
        date: getWeekdayLabel(),
        intensity: payload.intensity,
        emotion,
      });
    }

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
    await updateJournalEntry(id, payload);
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

