import type { MealType } from '../types';
import { tr } from '../i18n';
import { personalize } from './reminderText';

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
    bodies: ['{name}, hora do pequeno-almoço! Registe-o para manter o seu acompanhamento preciso.', 'Bom dia, {name}! Lembre-se de adicionar o pequeno-almoço ao diário.'],
  },
  {
    type: 'lunch',
    hour: 12,
    minute: 30,
    title: TITLE,
    bodies: ['{name}, hora do almoço! Registe-o para manter o seu acompanhamento preciso.', 'Bom almoço, {name}! Lembre-se de adicioná-lo ao diário.'],
  },
  {
    type: 'snack',
    hour: 16,
    minute: 0,
    title: TITLE,
    bodies: ['{name}, hora do lanche! Registe-o para manter o seu acompanhamento preciso.', 'Bom lanche, {name}! Lembre-se de adicioná-lo ao diário.'],
  },
  {
    type: 'dinner',
    hour: 20,
    minute: 30,
    title: TITLE,
    bodies: ['{name}, hora do jantar! Registe-o para manter o seu acompanhamento preciso.', 'Bom jantar, {name}! Lembre-se de adicioná-lo ao diário.'],
  },
];

/** Avisos extra do dia: ao fim do dia, confirmar que tudo foi registado. */
const REVIEW = {
  hour: 21,
  minute: 30,
  title: 'Lembrete do diário',
  bodies: ['Registou todas as suas refeições hoje, {name}? Verifique agora!', '{name}, antes de dormir: confirme que registou tudo hoje (refeições e água).'],
};

/** Quem passou o dia sem registar nenhum alimento recebe este aviso ao fim da tarde (com sequência: "vamos manter a sequência viva"). */
const EMPTY = {
  hour: 19,
  minute: 30,
  title: 'Lembrete do diário',
  bodies: ['{name}, ainda não registou nenhum alimento hoje. Vamos manter a sequência viva!', 'Ainda não registou nenhum alimento hoje, {name}. Fotografe a sua refeição e continue.'],
};

const DAYS_AHEAD = 4;

interface Input {
  now: Date;
  firstName?: string;
  /** Refeições de hoje que já têm registo: não lembramos o que já foi feito. */
  loggedToday: MealType[];
  /** Dias seguidos a registar (até ontem). Com sequência, o aviso fala em mantê-la. */
  streak?: number;
  days?: number;
}

/** Planeia os lembretes de refeição dos próximos dias, com mensagens a rodar. */
export function planMealReminders({ now, firstName, loggedToday, streak = 0, days = DAYS_AHEAD }: Input): PlannedMealReminder[] {
  const result: PlannedMealReminder[] = [];
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  for (let d = 0; d < days; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    SLOTS.forEach((slot, s) => {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.hour, slot.minute, 0, 0);
      if (at.getTime() <= now.getTime() + 60_000) return;
      if (d === 0 && loggedToday.includes(slot.type)) return;
      const body = personalize(tr(slot.bodies[(dayOfYear + d + s) % slot.bodies.length]), firstName);
      result.push({ at, title: tr(slot.title), body });
    });
    const extra = (x: typeof REVIEW, skip: boolean, salt: number, fixed?: number) => {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), x.hour, x.minute, 0, 0);
      if (at.getTime() <= now.getTime() + 60_000 || (d === 0 && skip)) return;
      result.push({ at, title: tr(x.title), body: personalize(tr(x.bodies[fixed ?? (dayOfYear + d + salt) % x.bodies.length]), firstName) });
    };
    extra(EMPTY, loggedToday.length > 0, 2, streak > 0 ? 0 : 1);
    // Dia sem nenhum registo: só o aviso das 19:30. Com alguns registos, o das 21:30 confirma o que falta.
    extra(REVIEW, loggedToday.length === 0 || ['breakfast', 'lunch', 'dinner'].every((t) => loggedToday.includes(t as MealType)), 1);
  }
  return result;
}
