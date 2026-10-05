import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { todayKey } from '../services/date';
import { GLASS_ML, glassesFromMl } from '../services/goals';
import { getWater, setWater } from '../services/repositories/tracker';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

const MAX_GLASSES = 30;

interface WaterContextValue {
  glasses: number;
  /** Meta em copos de 250 ml, calculada pelo Nutri a partir do quiz. */
  goalGlasses: number;
  goalMl: number;
  drankMl: number;
  error: string | null;
  increment: () => void;
  decrement: () => void;
}

const WaterContext = createContext<WaterContextValue | null>(null);

/** Estado partilhado da água de hoje (Home, aba Água e lembretes). */
export function WaterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { goals } = useProfile();
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

  const value = useMemo<WaterContextValue>(
    () => ({
      glasses,
      goalGlasses: glassesFromMl(goals.waterMl),
      goalMl: goals.waterMl,
      drankMl: glasses * GLASS_ML,
      error,
      increment: () => update(1),
      decrement: () => update(-1),
    }),
    [glasses, goals.waterMl, error, update],
  );

  return <WaterContext.Provider value={value}>{children}</WaterContext.Provider>;
}

export function useWater(): WaterContextValue {
  const ctx = useContext(WaterContext);
  if (!ctx) throw new Error('useWater deve ser usado dentro de <WaterProvider>');
  return ctx;
}
