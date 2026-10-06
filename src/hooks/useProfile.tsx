import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_GOALS, calculateGoals } from '../services/goals';
import {
  getProfile,
  saveCustomGoals,
  saveOnboarding,
  saveReminderSettings,
  saveWaterGoal,
  type ReminderSettings,
} from '../services/repositories/profile';
import type { DailyGoals, QuizAnswers, UserProfile } from '../types';
import { useAuth } from './useAuth';

interface ProfileContextValue {
  profile: UserProfile | null;
  /** true enquanto o perfil ainda está a ser carregado (após iniciar sessão). */
  loading: boolean;
  /** Metas calculadas no quiz; usa valores padrão enquanto não existirem. */
  goals: DailyGoals;
  /** true se o utilizador tem sessão mas ainda não fez o quiz. */
  needsOnboarding: boolean;
  refresh: () => Promise<void>;
  /** Calcula as metas, guarda tudo no Supabase e devolve as metas. */
  completeOnboarding: (answers: QuizAnswers) => Promise<DailyGoals>;
  saveReminders: (settings: ReminderSettings) => Promise<void>;
  saveWaterGoalMl: (ml: number) => Promise<void>;
  /** Metas personalizadas (PRO) + peso desejado. */
  saveGoals: (goals: DailyGoals, targetWeightKg: number) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Perfil "carregado" para este utilizador; evita mostrar a app antes de saber se falta o quiz.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setProfile(await getProfile(userId));
    } catch {
      // Sem rede: mantém o último perfil conhecido (ou nenhum).
    } finally {
      setLoadedFor(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoadedFor(null);
      return;
    }
    void refresh();
  }, [userId, refresh]);

  const completeOnboarding = useCallback(
    async (answers: QuizAnswers) => {
      if (!userId) throw new Error('Sessão inválida. Inicie sessão novamente.');
      const goals = calculateGoals(answers);
      await saveOnboarding(userId, answers, goals);
      setProfile((prev) => ({
        fullName: prev?.fullName ?? '',
        goal: answers.goal,
        quiz: answers,
        goals,
        waterReminders: prev?.waterReminders ?? true,
        wakeHour: prev?.wakeHour ?? 7,
        sleepHour: prev?.sleepHour ?? 22,
        onboardingCompleted: true,
      }));
      return goals;
    },
    [userId],
  );

  const saveReminders = useCallback(
    async (settings: ReminderSettings) => {
      if (!userId) return;
      await saveReminderSettings(userId, settings);
      setProfile((prev) => (prev ? { ...prev, ...settings } : prev));
    },
    [userId],
  );

  const saveWaterGoalMl = useCallback(
    async (ml: number) => {
      if (!userId) return;
      await saveWaterGoal(userId, ml);
      setProfile((prev) => (prev && prev.goals ? { ...prev, goals: { ...prev.goals, waterMl: ml } } : prev));
    },
    [userId],
  );

  const saveGoals = useCallback(
    async (goals: DailyGoals, targetWeightKg: number) => {
      if (!userId) return;
      await saveCustomGoals(userId, goals, targetWeightKg);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              goals,
              quiz: prev.quiz ? { ...prev.quiz, targetWeightKg } : prev.quiz,
            }
          : prev,
      );
    },
    [userId],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading: userId !== null && loadedFor !== userId,
      goals: profile?.goals ?? DEFAULT_GOALS,
      needsOnboarding: profile !== null && !profile.onboardingCompleted,
      refresh,
      completeOnboarding,
      saveReminders,
      saveWaterGoalMl,
      saveGoals,
    }),
    [profile, userId, loadedFor, refresh, completeOnboarding, saveReminders, saveWaterGoalMl, saveGoals],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile deve ser usado dentro de <ProfileProvider>');
  return ctx;
}
