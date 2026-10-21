import { useEffect, useMemo } from 'react';
import type { MealType } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useProfile } from '../hooks/useProfile';
import { useDiary } from '../hooks/useDiary';
import { useWater } from '../hooks/useWater';
import { waterProfileFromQuiz } from '../services/waterReminderPlan';
import { dayKeyOf, mealTypeOf } from '../services/dayUtils';
import { todayKey } from '../services/date';
import { loadCoachContext } from '../services/coachProfile';
import { setReminderName } from '../services/reminderText';
import { cancelWaterReminders, scheduleMealReminders, scheduleWaterReminders } from '../services/notifications';

/**
 * Mantém os lembretes de água sincronizados: sempre que o progresso, a meta, o objetivo
 * ou os horários mudam, o plano de notificações é recalculado. Não desenha nada.
 */
export function RemindersSync() {
  const { user } = useAuth();
  const { profile, onboardingDone } = useReminderInputs();
  const { glasses, goalGlasses } = useWater();
  const { meals } = useDiary();
  const { lang } = useTheme();

  const enabled = !!user && onboardingDone && (profile?.waterReminders ?? false);
  const wakeHour = profile?.wakeHour ?? 7;
  const sleepHour = profile?.sleepHour ?? 22;
  const goal = profile?.goal ?? null;
  const firstName = profile?.fullName.split(' ')[0] || undefined;
  const quiz = profile?.quiz;
  setReminderName(firstName);
  useEffect(() => {
    if (user?.id) void loadCoachContext(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      void cancelWaterReminders();
      return;
    }
    // Pequeno atraso: agrupa toques rápidos em + antes de reagendar.
    const timer = setTimeout(() => {
      void scheduleWaterReminders(
        { now: new Date(), glasses, goalGlasses, wakeHour, sleepHour, goal, firstName, ...waterProfileFromQuiz(quiz) },
        enabled,
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [user, enabled, glasses, goalGlasses, wakeHour, sleepHour, goal, firstName, quiz, lang]);

  // Refeições de hoje já registadas (ex.: "breakfast,lunch"): não se lembra o que já está feito.
  const loggedKey = useMemo(() => {
    const today = todayKey();
    return [...new Set(meals.filter((m) => dayKeyOf(m.createdAt) === today).map((m) => mealTypeOf(m)))].sort().join(',');
  }, [meals]);

  // Os lembretes de refeição são reagendados quando muda o idioma, o nome ou o que já foi registado hoje.
  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem('nutria.mealReminders')
      .then((v) =>
        v === '1'
          ? scheduleMealReminders(true, { firstName, loggedToday: loggedKey ? (loggedKey.split(',') as MealType[]) : [] })
          : undefined,
      )
      .catch(() => undefined);
  }, [user, lang, firstName, loggedKey]);

  return null;
}

function useReminderInputs() {
  const { profile } = useProfile();
  return { profile, onboardingDone: profile?.onboardingCompleted ?? false };
}
