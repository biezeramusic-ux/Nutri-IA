import { useCallback, useEffect, useRef, useState } from 'react';
import { todayKey } from '../services/date';
import { getWater, setWater } from '../services/repositories/tracker';
import { useAuth } from './useAuth';

export const WATER_GOAL = 8;
const MAX_GLASSES = 20;

export function useWater() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [glasses, setGlasses] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  // Fila de escritas: mantém a ordem dos toques rápidos em + e −.
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!userId) {
      latest.current = 0;
      setGlasses(0);
      return;
    }
    let active = true;
    getWater(userId, todayKey())
      .then((n) => {
        if (!active) return;
        latest.current = n;
        setGlasses(n);
        setError(null);
      })
      .catch(() => active && setError('Sem ligação: não foi possível carregar a água de hoje.'));
    return () => {
      active = false;
    };
  }, [userId]);

  const update = useCallback(
    (delta: number) => {
      if (!userId) return;
      const next = Math.min(MAX_GLASSES, Math.max(0, latest.current + delta));
      if (next === latest.current) return;
      latest.current = next;
      setGlasses(next);
      const day = todayKey();
      queue.current = queue.current
        .then(() => setWater(userId, day, next))
        .then(() => setError(null))
        .catch(() => setError('Sem ligação: a alteração não foi guardada.'));
    },
    [userId],
  );

  return {
    glasses,
    goal: WATER_GOAL,
    error,
    increment: useCallback(() => update(1), [update]),
    decrement: useCallback(() => update(-1), [update]),
  };
}
