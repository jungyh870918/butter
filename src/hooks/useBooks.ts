import { useState, useEffect } from 'react';
import { Book } from '../types';
import { getBooks } from '../lib/api';

export function useBooks(tag?: string) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = tag && tag !== 'All' ? { tag } : {};
    getBooks(params)
      .then(setBooks)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tag]);

  return { books, loading, error };
}
