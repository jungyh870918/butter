import { useState, useEffect } from 'react';
import { Book } from '../types';
import { getBooks } from '../lib/api';

export function useBooks(tag?: string, search?: string, lang?: string) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const params: { tag?: string; search?: string; lang?: string } = {};
    if (search && search.trim()) {
      params.search = search.trim();
    } else if (tag && tag !== 'All') {
      params.tag = tag;
    }
    if (lang) params.lang = lang;

    getBooks(params)
      .then(setBooks)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tag, search, lang]);

  return { books, loading, error };
}
