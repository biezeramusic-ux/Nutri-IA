import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useProfile } from '../hooks/useProfile';
import { useWater } from '../hooks/useWater';
import { getWaterMessages } from '../services/aiText';
import { cancelWaterReminders, scheduleMealReminders, scheduleWaterReminders } from '../services/notifications';

/**
 * Mantém os lembretes de água sincronizados: sempre que o progresso, a meta, o objetivo
 * ou os horários mudam, o plano de notificações é recalculado. Não desenha nada.
 */
export function RemindersSync() {
  const { user } = useAuth();
  const { profile, onboardingDone } = useReminderInputs();
  const { glasses, goalGlasses } = useWater();
  const { lang } = useTheme();

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
      void (async () => {
        // Frases da IA (1 pedido por dia); sem rede, usa as frases fixas.
        const messages = enabled ? await getWaterMessages(goal) : null;
        await scheduleWaterReminders(
          { now: new Date(), glasses, goalGlasses, wakeHour, sleepHour, goal, firstName, messages },
          enabled,
        );
      })();
    }, 800);
    return () => clearTimeout(timer);
  }, [user, enabled, glasses, goalGlasses, wakeHour, sleepHour, goal, firstName, lang]);

  // Os lembretes de refeição são reagendados quando o idioma muda (o texto vai na notificação).
  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem('nutria.mealReminders')
      .then((v) => (v === '1' ? scheduleMealReminders(true) : undefined))
      .catch(() => undefined);
  }, [user, lang]);

  return null;
}

function useReminderInputs() {
  const { profile } = useProfile();
  return { profile, onboardingDone: profile?.onboardingCompleted ?? false };
}
