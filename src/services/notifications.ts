import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { planWaterReminders, type ReminderPlanInput } from './waterReminderPlan';

const CHANNEL_ID = 'water-reminders';
const KIND_WATER = 'water';
const KIND_MEAL = 'meal';
const MEAL_NUDGE_DELAY_MS = 5 * 60 * 1000;

// Mostra a notificação mesmo com a app aberta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Garante o canal (Android) e, se `request`, pede a permissão ao utilizador. */
export async function ensureNotificationPermission(request: boolean): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Lembretes de água',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!request || !current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function cancelByKind(kind: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.content.data?.kind === kind)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function cancelWaterReminders(): Promise<void> {
  try {
    await cancelByKind(KIND_WATER);
  } catch {
    // Notificações indisponíveis (ex.: web): ignora.
  }
}

/** Recria os lembretes de água a partir do progresso atual. */
export async function scheduleWaterReminders(input: ReminderPlanInput, enabled: boolean): Promise<void> {
  try {
    await cancelByKind(KIND_WATER);
    if (!enabled || !(await ensureNotificationPermission(false))) return;
    for (const reminder of planWaterReminders(input)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body, data: { kind: KIND_WATER } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.at,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch {
    // Falha a agendar não deve quebrar a app.
  }
}

/** Depois de um scan: sugere beber um copo de água com a refeição. */
export async function scheduleMealWaterNudge(): Promise<void> {
  try {
    if (!(await ensureNotificationPermission(false))) return;
    await cancelByKind(KIND_MEAL);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🥤 Refeição registada',
        body: 'Beba um copo de água com a sua refeição.',
        data: { kind: KIND_MEAL },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + MEAL_NUDGE_DELAY_MS),
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // ignora
  }
}
