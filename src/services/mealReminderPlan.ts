import type { MealType } from '../types';
import { tr } from '../i18n';

export interface PlannedMealReminder {
  at: Date;
  title: string;
  body: string;
}

interface Slot {
  type: MealType;
  hour: number;
  minute: number;
  title: string;
  /** Várias mensagens: rodam de dia para dia para não cansar. */
  bodies: string[];
}

const TITLE = 'Refeições';

/** Mensagens simples e diretas (sem emojis nem nome), como uma notificação normal de lembrete. */
const SLOTS: Slot[] = [
  {
    type: 'breakfast',
    hour: 8,
    minute: 0,
    title: TITLE,
    bodies: ['Hora do pequeno-almoço! Registe-o para manter o seu acompanhamento preciso.', 'Bom dia! Lembre-se de adicionar o pequeno-almoço ao diário.'],
  },
  {
    type: 'lunch',
    hour: 12,
    minute: 30,
    title: TITLE,
    bodies: ['Hora do almoço! Registe-o para manter o seu acompanhamento preciso.', 'Bom almoço! Lembre-se de adicioná-lo ao diário.'],
  },
  {
    type: 'snack',
    hour: 16,
    minute: 0,
    title: TITLE,
    bodies: ['Hora do lanche! Registe-o para manter o seu acompanhamento preciso.', 'Bom lanche! Lembre-se de adicioná-lo ao diário.'],
  },
  {
    type: 'dinner',
    hour: 20,
    minute: 30,
    title: TITLE,
    bodies: ['Hora do jantar! Registe-o para manter o seu acompanhamento preciso.', 'Bom jantar! Lembre-se de adicioná-lo ao diário.'],
  },
];

const DAYS_AHEAD = 4;

interface Input {
  now: Date;
  firstName?: string;
  /** Refeições de hoje que já têm registo: não lembramos o que já foi feito. */
  loggedToday: MealType[];
  days?: number;
}

/** Planeia os lembretes de refeição dos próximos dias, com mensagens a rodar. */
export function planMealReminders({ now, loggedToday, days = DAYS_AHEAD }: Input): PlannedMealReminder[] {
  const result: PlannedMealReminder[] = [];
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  for (let d = 0; d < days; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    SLOTS.forEach((slot, s) => {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.hour, slot.minute, 0, 0);
      if (at.getTime() <= now.getTime() + 60_000) return;
      if (d === 0 && loggedToday.includes(slot.type)) return;
      const body = tr(slot.bodies[(dayOfYear + d + s) % slot.bodies.length]);
      result.push({ at, title: tr(slot.title), body });
    });
  }
  return result;
}
