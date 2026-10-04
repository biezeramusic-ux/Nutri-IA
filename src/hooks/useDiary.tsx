import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { insertMeal, listMeals } from '../services/repositories/meals';
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
  refresh: () => Promise<void>;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [current, setCurrent] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setMeals(await listMeals());
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

  const saveMeal = useCallback(
    async (meal: Meal) => {
      if (!userId) throw new Error('Sessão inválida. Inicie sessão novamente.');
      await insertMeal(userId, meal);
      setMeals((prev) => [meal, ...prev.filter((m) => m.id !== meal.id)]);
    },
    [userId],
  );

  const isSaved = useCallback((id: string) => meals.some((m) => m.id === id), [meals]);

  const value = useMemo<DiaryContextValue>(
    () => ({ meals, loading, error, current, setCurrent, isSaved, saveMeal, refresh }),
    [meals, loading, error, current, isSaved, saveMeal, refresh],
  );
  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary deve ser usado dentro de <DiaryProvider>');
  return ctx;
}
