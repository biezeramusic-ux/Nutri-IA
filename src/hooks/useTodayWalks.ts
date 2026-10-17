import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { todayKey } from '../services/date';
import { isRegistered, loadWalks, type Walk } from '../services/walks';
import { useAuth } from './useAuth';

/** Caminhadas e corridas já registadas hoje (para a Home). Recarrega sempre que a Home volta ao ecrã. */
export function useTodayWalks() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [walks, setWalks] = useState<Walk[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (!userId) {
        setWalks([]);
        return;
      }
      void loadWalks(userId).then((all) => {
        if (!alive) return;
        const today = todayKey();
        setWalks(all.filter((w) => isRegistered(w) && todayKey(new Date(w.start)) === today));
      });
      return () => {
        alive = false;
      };
    }, [userId]),
  );

  const distanceM = walks.reduce((s, w) => s + w.distanceM, 0);
  const ms = walks.reduce((s, w) => s + (w.end - w.start), 0);
  const steps = walks.reduce((s, w) => s + w.steps, 0);
  const kcal = walks.reduce((s, w) => s + w.kcal, 0);
  return { walks, distanceM, ms, steps, kcal, last: walks[0] ?? null };
}
