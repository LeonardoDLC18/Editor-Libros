import { useEffect, useState } from 'react';
import { fetchBook } from '../services/book';
import type { BookData } from '../types/schema';

export function useBook() {
  const [data, setData] = useState<BookData>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetchBook(controller.signal).then(setData).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo leer el libro.');
    });
    return () => controller.abort();
  }, [attempt]);
  return { data, error, retry: () => setAttempt((value) => value + 1) };
}
