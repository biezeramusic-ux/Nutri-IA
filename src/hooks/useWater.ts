import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS, loadJSON, saveJSON, todayKey } from '../services/storage';

export const WATER_GOAL = 8;

interface WaterState {
  date: string;
  glasses: number;
}

export function useWater() {
  const [glasses, setGlasses] = useState(0);

  useEffect(() => {
    void loadJSON<WaterState>(STORAGE_KEYS.water, { date: todayKey(), glasses: 0 }).then((s) =>
      setGlasses(s.date === todayKey() ? s.glasses : 0),
    );
  }, []);

  const update = useCallback((delta: number) => {
    setGlasses((prev) => {
      const next = Math.min(20, Math.max(0, prev + delta));
      void saveJSON<WaterState>(STORAGE_KEYS.water, { date: todayKey(), glasses: next });
      return next;
    });
  }, []);

  return {
    glasses,
    goal: WATER_GOAL,
    increment: useCallback(() => update(1), [update]),
    decrement: useCallback(() => update(-1), [update]),
  };
}
