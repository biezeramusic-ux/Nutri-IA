import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { todayKey } from '../services/date';
import { addActivity, deleteActivity, getSteps, listActivities, saveSteps } from '../services/repositories/tracker';
import type { ActivityLog } from '../types';
import { useAuth } from './useAuth';

const SAVE_DELAY_MS = 700;

/** Atividades e passos de hoje. */
export function useActivity() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [steps, setStepsState] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    loaded.current = false;
    if (!userId) {
      setActivities([]);
      setStepsState(0);
      return;
    }
    let active = true;
    const day = todayKey();
    Promise.all([listActivities(userId, day), getSteps(userId, day)])
      .then(([list, st]) => {
        if (!active) return;
        setActivities(list);
        setStepsState(st);
        setError(null);
        loaded.current = true;
      })
      .catch(() => active && setError('Sem ligação: não foi possível carregar a atividade.'));
    return () => {
      active = false;
    };
  }, [userId]);

  // Guarda os passos com pequeno atraso (agrupa toques).
  useEffect(() => {
    if (!userId || !loaded.current) return;
    const timer = setTimeout(() => {
      saveSteps(userId, todayKey(), steps).catch(() => setError('Sem ligação: os passos não foram guardados.'));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [steps, userId]);

  const add = useCallback(
    async (entry: { type: string; minutes: number; kcal: number }) => {
      if (!userId) throw new Error('Sessão inválida.');
      const created = await addActivity(userId, { day: todayKey(), ...entry });
      setActivities((prev) => [created, ...prev]);
    },
    [userId],
  );

  const remove = useCallback(async (id: string) => {
    await deleteActivity(id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const totals = useMemo(
    () => ({
      kcal: activities.reduce((s, a) => s + a.kcal, 0),
      minutes: activities.reduce((s, a) => s + a.minutes, 0),
    }),
    [activities],
  );

  return { activities, steps, setSteps: setStepsState, totals, error, add, remove };
}
