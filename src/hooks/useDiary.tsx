import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { AppState } from 'react-native';
import { deleteMealById, insertMeal, listMeals } from '../services/repositories/meals';
import type { Meal } from '../types';
import { useAuth } from './useAuth';

interface DiaryContextValue {
  meals: Meal[];
  loading: boolean;
  /** Mensagem do último erro de carregamento (ex.: sem rede), ou null. */
  error: string | null;
  /** Refeição aberta no ecrã de detalhes (ainda pode não estar salva). */
  current: Meal | null;
  setCurrent: (meal: Meal | null) => void;
  isSaved: (id: string) => boolean;
  /** Guarda no Supabase. Lança erro se falhar (ex.: sem rede). */
  saveMeal: (meal: Meal) => Promise<void>;
  /** Apaga uma refeição guardada. */
  removeMeal: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  /** Refeições guardadas só no telemóvel, à espera de ligação para sincronizar. */
  pendingCount: number;
}

const NETWORK_ERROR = /network request failed|failed to fetch|network error|timeout|timed out|fetch failed/i;
const LIMIT_ERROR = /meal_limit_reached|trial_expired/;
const pendingKey = (userId: string) => `nutria.pending-meals.${userId}`;

async function loadPending(userId: string): Promise<Meal[]> {
  try {
    const raw = await AsyncStorage.getItem(pendingKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Meal[]) : [];
  } catch {
    return [];
  }
}

const storePending = (userId: string, items: Meal[]) =>
  AsyncStorage.setItem(pendingKey(userId), JSON.stringify(items)).catch(() => undefined);

const DiaryContext = createContext<DiaryContextValue | null>(null);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [current, setCurrent] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Meal[]>([]);
  const flushing = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const queued = await loadPending(userId);
      setPending(queued);
      const remote = await listMeals();
      setMeals([...queued.filter((q) => !remote.some((r) => r.id === q.id)), ...remote]);
      setError(null);
    } catch {
      setError('Não foi possível carregar o histórico. Verifique a ligação.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setMeals([]);
      setCurrent(null);
      setError(null);
      return;
    }
    void refresh();
  }, [userId, refresh]);

  /** Envia para o servidor as refeições guardadas offline. */
  const flushPending = useCallback(async () => {
    if (!userId || flushing.current) return;
    flushing.current = true;
    try {
      const queue = await loadPending(userId);
      if (queue.length === 0) return;
      const left: Meal[] = [];
      for (const meal of queue) {
        try {
          const saved = await insertMeal(userId, meal);
          setMeals((prev) => [saved, ...prev.filter((m) => m.id !== meal.id && m.id !== saved.id)]);
        } catch (e) {
          const message = e instanceof Error ? e.message : '';
          if (LIMIT_ERROR.test(message)) {
            // Limite do plano: esta refeição já não pode ser guardada.
            setMeals((prev) => prev.filter((m) => m.id !== meal.id));
          } else {
            left.push(meal);
          }
        }
      }
      await storePending(userId, left);
      setPending(left);
    } finally {
      flushing.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void flushPending();
    const timer = setInterval(() => void flushPending(), 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flushPending();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [userId, flushPending]);

  const saveMeal = useCallback(
    async (meal: Meal) => {
      if (!userId) throw new Error('Sessão inválida. Inicie sessão novamente.');
      try {
        const saved = await insertMeal(userId, meal);
        setMeals((prev) => [saved, ...prev.filter((m) => m.id !== saved.id)]);
      } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (!NETWORK_ERROR.test(message) || LIMIT_ERROR.test(message)) throw e;
        // Sem ligação: guarda no telemóvel e sincroniza quando a rede voltar.
        const queued = [...(await loadPending(userId)).filter((m) => m.id !== meal.id), meal];
        await storePending(userId, queued);
        setPending(queued);
        setMeals((prev) => [meal, ...prev.filter((m) => m.id !== meal.id)]);
      }
    },
    [userId],
  );

  const removeMeal = useCallback(
    async (id: string) => {
      if (userId) {
        const queued = await loadPending(userId);
        if (queued.some((m) => m.id === id)) {
          const left = queued.filter((m) => m.id !== id);
          await storePending(userId, left);
          setPending(left);
          setMeals((prev) => prev.filter((m) => m.id !== id));
          return;
        }
      }
      await deleteMealById(id);
      setMeals((prev) => prev.filter((m) => m.id !== id));
    },
    [userId],
  );

  const isSaved = useCallback((id: string) => meals.some((m) => m.id === id), [meals]);

  const value = useMemo<DiaryContextValue>(
    () => ({ meals, loading, error, current, setCurrent, isSaved, saveMeal, removeMeal, refresh, pendingCount: pending.length }),
    [meals, loading, error, current, isSaved, saveMeal, removeMeal, refresh, pending.length],
  );
  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary deve ser usado dentro de <DiaryProvider>');
  return ctx;
}
