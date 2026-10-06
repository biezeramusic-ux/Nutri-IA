import { useCallback, useEffect, useState } from 'react';
import { todayKey } from '../services/date';
import { listWeights, saveWeight } from '../services/repositories/tracker';
import type { WeightLog } from '../types';
import { useAuth } from './useAuth';

function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return todayKey(d);
}

/** Registos de peso dos últimos `days` dias. */
export function useWeightLogs(days = 90) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLogs([]);
      return;
    }
    let active = true;
    listWeights(userId, daysAgoKey(days))
      .then((l) => {
        if (!active) return;
        setLogs(l);
        setError(null);
      })
      .catch(() => active && setError('Sem ligação: não foi possível carregar o peso.'));
    return () => {
      active = false;
    };
  }, [userId, days]);

  /** Guarda o peso de hoje (substitui o de hoje, se já existir). */
  const addToday = useCallback(
    async (weightKg: number) => {
      if (!userId) throw new Error('Sessão inválida.');
      const day = todayKey();
      await saveWeight(userId, day, weightKg);
      setLogs((prev) => [...prev.filter((l) => l.day !== day), { day, weightKg }].sort((a, b) => a.day.localeCompare(b.day)));
    },
    [userId],
  );

  return { logs, error, addToday };
}
