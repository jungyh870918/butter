import { useState, useEffect } from 'react';
import { Reflection } from '../types';
import { getReflections, getBookReflections } from '../lib/api';

interface UseReflectionsOptions {
  bookId?: string;
  limit?: number;
}

export function useReflections(options: UseReflectionsOptions = {}) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const fetch = options.bookId
      ? getBookReflections(options.bookId)
      : getReflections({ limit: options.limit });

    fetch
      .then(setReflections)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [options.bookId, options.limit]);

  return { reflections, loading, error };
}
