import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEYS, loadJSON, saveJSON } from '../services/storage';
import type { Meal } from '../types';

interface DiaryContextValue {
  meals: Meal[];
  /** Refeição aberta no ecrã de detalhes (ainda pode não estar salva). */
  current: Meal | null;
  setCurrent: (meal: Meal | null) => void;
  isSaved: (id: string) => boolean;
  saveMeal: (meal: Meal) => void;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [current, setCurrent] = useState<Meal | null>(null);

  useEffect(() => {
    void loadJSON<Meal[]>(STORAGE_KEYS.diary, []).then(setMeals);
  }, []);

  const saveMeal = useCallback((meal: Meal) => {
    setMeals((prev) => {
      if (prev.some((m) => m.id === meal.id)) return prev;
      const next = [meal, ...prev].slice(0, 200);
      void saveJSON(STORAGE_KEYS.diary, next);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => meals.some((m) => m.id === id), [meals]);

  const value = useMemo(
    () => ({ meals, current, setCurrent, isSaved, saveMeal }),
    [meals, current, isSaved, saveMeal],
  );
  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary deve ser usado dentro de <DiaryProvider>');
  return ctx;
}
