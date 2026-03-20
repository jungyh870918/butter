import { useState, useEffect } from 'react';
import { EmotionData, EmotionSummary } from '../types';
import { getEmotions, getEmotionSummary } from '../lib/api';

export function useEmotions() {
  const [emotions, setEmotions] = useState<EmotionData[]>([]);
  const [summary, setSummary] = useState<EmotionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([getEmotions(), getEmotionSummary()])
      .then(([emotionData, summaryData]) => {
        setEmotions(emotionData);
        setSummary(summaryData);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { emotions, summary, loading, error };
}
