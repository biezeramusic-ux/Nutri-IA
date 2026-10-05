import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWater } from '../hooks/useWater';
import { cancelWaterReminders, scheduleWaterReminders } from '../services/notifications';

/**
 * Mantém os lembretes de água sincronizados: sempre que o progresso, a meta, o objetivo
 * ou os horários mudam, o plano de notificações é recalculado. Não desenha nada.
 */
export function RemindersSync() {
  const { user } = useAuth();
  const { profile, onboardingDone } = useReminderInputs();
  const { glasses, goalGlasses } = useWater();

  const enabled = !!user && onboardingDone && (profile?.waterReminders ?? false);
  const wakeHour = profile?.wakeHour ?? 7;
  const sleepHour = profile?.sleepHour ?? 22;
  const goal = profile?.goal ?? null;
  const firstName = profile?.fullName.split(' ')[0] || undefined;

  useEffect(() => {
    if (!user) {
      void cancelWaterReminders();
      return;
    }
    // Pequeno atraso: agrupa toques rápidos em + antes de reagendar.
    const timer = setTimeout(() => {
      void scheduleWaterReminders(
        { now: new Date(), glasses, goalGlasses, wakeHour, sleepHour, goal, firstName },
        enabled,
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [user, enabled, glasses, goalGlasses, wakeHour, sleepHour, goal, firstName]);

  return null;
}

function useReminderInputs() {
  const { profile } = useProfile();
  return { profile, onboardingDone: profile?.onboardingCompleted ?? false };
}
