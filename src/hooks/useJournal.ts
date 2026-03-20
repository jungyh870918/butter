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

export function useJournal(enabled: boolean) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEntries = useCallback(() => {
    setLoading(true);
    setError('');
    getJournalEntries()
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (enabled) fetchEntries();
  }, [enabled, fetchEntries]);

  const create = async (payload: {
    content: string;
    prompt: string;
    mood: string;
    intensity: number;
  }): Promise<{ id: string }> => {
    const entry = await createJournalEntry({
      content: payload.content,
      prompt: payload.prompt,
      mood: payload.mood || null,
      intensity: payload.intensity,
    });
    if (payload.mood) {
      await createEmotionLog({
        date: getWeekdayLabel(),
        intensity: payload.intensity,
        emotion: payload.mood,
      });
    }
    return entry; // { id, date, content, ... }
  };

  const update = async (
    id: string,
    payload: { content: string; mood: string; intensity: number },
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
