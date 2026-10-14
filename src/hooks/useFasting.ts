import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { scheduleFastEnd } from '../services/notifications';
import { useAuth } from './useAuth';

export interface FastRecord {
  start: number;
  end: number;
  goalHours: number;
}

interface State {
  goalHours: number;
  active: { start: number; goalHours: number } | null;
  history: FastRecord[];
}

const EMPTY: State = { goalHours: 16, active: null, history: [] };
const key = (id: string) => `nutria.fasting.${id}`;

export const FASTING_PLANS = [12, 14, 16, 18, 20, 24];

/** Jejum intermitente guardado no telemóvel (plano, jejum em curso e histórico). */
export function useFasting() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anon';
  const [state, setState] = useState<State>(EMPTY);
  const [now, setNow] = useState(Date.now());
  const loaded = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      AsyncStorage.getItem(key(userId))
        .then((raw) => {
          if (!alive) return;
          setState(raw ? { ...EMPTY, ...(JSON.parse(raw) as State) } : EMPTY);
          loaded.current = true;
        })
        .catch(() => undefined);
      return () => {
        alive = false;
      };
    }, [userId]),
  );

  useEffect(() => {
    if (!state.active) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.active]);

  const commit = useCallback(
    (next: State) => {
      setState(next);
      void AsyncStorage.setItem(key(userId), JSON.stringify(next)).catch(() => undefined);
    },
    [userId],
  );

  const setGoal = (h: number) => commit({ ...state, goalHours: h });

  const start = (at = Date.now()) => {
    commit({ ...state, active: { start: at, goalHours: state.goalHours } });
    void scheduleFastEnd(new Date(at + state.goalHours * 3600000));
  };

  const stop = () => {
    if (!state.active) return;
    const rec: FastRecord = { start: state.active.start, end: Date.now(), goalHours: state.active.goalHours };
    commit({ ...state, active: null, history: [rec, ...state.history].slice(0, 60) });
    void scheduleFastEnd(null);
  };

  const active = state.active;
  const goalMs = (active?.goalHours ?? state.goalHours) * 3600000;
  const elapsedMs = active ? Math.max(0, now - active.start) : 0;
  return {
    goalHours: state.goalHours,
    active,
    history: state.history,
    elapsedMs,
    goalMs,
    remainingMs: Math.max(0, goalMs - elapsedMs),
    progress: active ? Math.min(1, elapsedMs / goalMs) : 0,
    done: !!active && elapsedMs >= goalMs,
    endAt: active ? active.start + goalMs : null,
    setGoal,
    start,
    stop,
  };
}

export function formatHMS(ms: number): string {
  const s = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
