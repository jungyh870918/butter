import { useState, useEffect } from 'react';
import { Book } from '../types';
import { getBook, getBookEnrich } from '../lib/api';

export function useBook(id: string | undefined) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);      // 1단계: 기본 정보
  const [enriching, setEnriching] = useState(false); // 2단계: GPT
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    setBook(null);

    // ── 1단계: 카카오/Google 기본 정보 — 즉시 렌더링 ──────────────────────
    getBook(id)
      .then((baseBook: Book) => {
        setBook(baseBook);
        setLoading(false);

        // ── 2단계: GPT enrich — 백그라운드에서 조용히 보강 ──────────────────
        if (!baseBook.title || !baseBook.author) return;
        setEnriching(true);
        getBookEnrich(id, baseBook.title, baseBook.author)
          .then((extra: Partial<Book>) => {
            setBook((prev) => prev ? { ...prev, ...extra } : prev);
          })
          .catch(() => {/* GPT 실패해도 기본 정보는 이미 표시됨 */})
          .finally(() => setEnriching(false));
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  return { book, loading, enriching, error };
}
