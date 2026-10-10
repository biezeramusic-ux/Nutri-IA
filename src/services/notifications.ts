import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { planWaterReminders, type ReminderPlanInput } from './waterReminderPlan';

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL_ID = 'water-reminders';
const KIND_WATER = 'water';
const KIND_MEAL = 'meal';
const MEAL_NUDGE_DELAY_MS = 5 * 60 * 1000;

/**
 * As notificações não funcionam no Expo Go (desde o SDK 53 o módulo falha ao carregar).
 * Funcionam na app instalada (APK/IPA). Por isso o módulo só é carregado fora do Expo Go.
 */
export const notificationsSupported =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let modulePromise: Promise<NotificationsModule | null> | null = null;

function loadNotifications(): Promise<NotificationsModule | null> {
  if (!notificationsSupported) return Promise.resolve(null);
  modulePromise ??= import('expo-notifications')
    .then((N) => {
      // Mostra a notificação mesmo com a app aberta.
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return N;
    })
    .catch(() => null);
  return modulePromise;
}

/** Garante o canal (Android) e, se `request`, pede a permissão ao utilizador. */
export async function ensureNotificationPermission(request: boolean): Promise<boolean> {
  const N = await loadNotifications();
  if (!N) return false;
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Lembretes de água',
        importance: N.AndroidImportance.DEFAULT,
      });
    }
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    if (!request || !current.canAskAgain) return false;
    return (await N.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function cancelByKind(N: NotificationsModule, kind: string): Promise<void> {
  const all = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.content.data?.kind === kind)
      .map((n) => N.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function cancelWaterReminders(): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;
  try {
    await cancelByKind(N, KIND_WATER);
  } catch {
    // ignora
  }
}

/** Recria os lembretes de água a partir do progresso atual. */
export async function scheduleWaterReminders(input: ReminderPlanInput, enabled: boolean): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;
  try {
    await cancelByKind(N, KIND_WATER);
    if (!enabled || !(await ensureNotificationPermission(false))) return;
    for (const reminder of planWaterReminders(input)) {
      await N.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body, data: { kind: KIND_WATER } },
        trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: reminder.at, channelId: CHANNEL_ID },
      });
    }
  } catch {
    // Falha a agendar não deve quebrar a app.
  }
}

/** Depois de um scan: sugere beber um copo de água com a refeição. */
export async function scheduleMealWaterNudge(): Promise<void> {
  const N = await loadNotifications();
  if (!N) return;
  try {
    if (!(await ensureNotificationPermission(false))) return;
    await cancelByKind(N, KIND_MEAL);
    await N.scheduleNotificationAsync({
      content: {
        title: '🥤 Refeição registada',
        body: 'Beba um copo de água com a sua refeição.',
        data: { kind: KIND_MEAL },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + MEAL_NUDGE_DELAY_MS),
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // ignora
  }
}

const KIND_MEAL_SLOT = 'meal-slot';

const MEAL_SLOTS = [
  { hour: 8, minute: 15, title: '☀️ Bom dia!', body: 'Já tomou o pequeno-almoço? Registe-o em segundos com uma foto.' },
  { hour: 12, minute: 45, title: '🍽️ Hora do almoço', body: 'Fotografe o seu prato para saber as calorias.' },
  { hour: 19, minute: 30, title: '🌙 Hora do jantar', body: 'Não se esqueça de registar o jantar e fechar o dia.' },
] as const;

/** Lembretes diários para registar as refeições (pequeno-almoço, almoço e jantar). */
export async function scheduleMealReminders(enabled: boolean): Promise<boolean> {
  const N = await loadNotifications();
  if (!N) return false;
  try {
    await cancelByKind(N, KIND_MEAL_SLOT);
    if (!enabled) return true;
    if (!(await ensureNotificationPermission(true))) return false;
    for (const slot of MEAL_SLOTS) {
      await N.scheduleNotificationAsync({
        content: { title: slot.title, body: slot.body, data: { kind: KIND_MEAL_SLOT } },
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: slot.hour, minute: slot.minute, channelId: CHANNEL_ID },
      });
    }
    return true;
  } catch {
    return false;
  }
}
