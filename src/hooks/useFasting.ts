import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS, loadJSON, saveJSON } from '../services/storage';

export const FASTING_GOAL_HOURS = 16;

interface FastingState {
  startedAt: number | null;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function useFasting() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    void loadJSON<FastingState>(STORAGE_KEYS.fasting, { startedAt: null }).then((s) =>
      setStartedAt(s.startedAt),
    );
  }, []);

  useEffect(() => {
    if (startedAt === null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const start = useCallback(() => {
    const ts = Date.now();
    setStartedAt(ts);
    void saveJSON<FastingState>(STORAGE_KEYS.fasting, { startedAt: ts });
  }, []);

  const stop = useCallback(() => {
    setStartedAt(null);
    void saveJSON<FastingState>(STORAGE_KEYS.fasting, { startedAt: null });
  }, []);

  const elapsedSeconds = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const progress = Math.min(1, elapsedSeconds / (FASTING_GOAL_HOURS * 3600));

  return {
    running: startedAt !== null,
    elapsedSeconds,
    display: formatDuration(elapsedSeconds),
    progress,
    goalHours: FASTING_GOAL_HOURS,
    start,
    stop,
  };
}
