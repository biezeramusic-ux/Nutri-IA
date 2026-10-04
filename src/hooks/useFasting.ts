import { useCallback, useEffect, useState } from 'react';
import {
  getActiveFast,
  startFast,
  stopFast,
  type ActiveFast,
} from '../services/repositories/tracker';
import { useAuth } from './useAuth';

export const FASTING_GOAL_HOURS = 16;

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function useFasting() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [fast, setFast] = useState<ActiveFast | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setFast(null);
      return;
    }
    let active = true;
    getActiveFast(userId)
      .then((f) => {
        if (!active) return;
        setFast(f);
        setError(null);
      })
      .catch(() => active && setError('Sem ligação: não foi possível carregar o jejum.'));
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!fast) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [fast]);

  const start = useCallback(async () => {
    if (!userId || busy) return;
    setBusy(true);
    try {
      setFast(await startFast(userId, FASTING_GOAL_HOURS));
      setError(null);
    } catch {
      setError('Não foi possível iniciar o jejum. Verifique a ligação.');
    } finally {
      setBusy(false);
    }
  }, [userId, busy]);

  const stop = useCallback(async () => {
    if (!fast || busy) return;
    setBusy(true);
    try {
      await stopFast(fast.id);
      setFast(null);
      setError(null);
    } catch {
      setError('Não foi possível terminar o jejum. Verifique a ligação.');
    } finally {
      setBusy(false);
    }
  }, [fast, busy]);

  const goalHours = fast?.goalHours ?? FASTING_GOAL_HOURS;
  const elapsedSeconds = fast ? Math.max(0, Math.floor((now - fast.startedAt) / 1000)) : 0;
  const progress = Math.min(1, elapsedSeconds / (goalHours * 3600));

  return {
    running: fast !== null,
    busy,
    error,
    elapsedSeconds,
    display: formatDuration(elapsedSeconds),
    progress,
    goalHours,
    start,
    stop,
  };
}
