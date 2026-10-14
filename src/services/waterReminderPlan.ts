import type { GoalType } from '../types';
import { tr } from '../i18n';

export interface ReminderPlanInput {
  now: Date;
  glasses: number;
  goalGlasses: number;
  wakeHour: number;
  sleepHour: number;
  goal: GoalType | null;
  firstName?: string;
  /** Quantos dias planear (hoje + seguintes). */
  days?: number;
  /** Frases geradas pela IA; se existirem, substituem as frases fixas. */
  messages?: string[] | null;
}

export interface PlannedReminder {
  at: Date;
  title: string;
  body: string;
}

const MINUTE = 60 * 1000;
const MIN_SPACING_MIN = 45;
const MAX_PER_DAY = 6;

/** Mensagens simples, no estilo de uma notificação normal de hidratação. */
const SIMPLE_MESSAGES = [
  'Está na hora de beber água e manter uma boa hidratação.',
  'Um copo de água agora ajuda a manter-se hidratado.',
  'Lembrete: beba água e cuide da sua hidratação.',
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function atHour(day: Date, hour: number): Date {
  // new Date(..., 24) avança para o dia seguinte às 00:00.
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

function evenSlots(start: Date, end: Date, count: number): Date[] {
  const span = end.getTime() - start.getTime();
  if (count <= 0 || span <= 0) return [];
  return Array.from({ length: count }, (_, i) => new Date(start.getTime() + ((i + 0.5) * span) / count));
}

function pickMessage(index: number): string {
  return tr(SIMPLE_MESSAGES[index % SIMPLE_MESSAGES.length]);
}

/**
 * Planeia os lembretes de água a partir do progresso atual:
 * - hoje: só se ainda faltar água; espaçados entre agora e a hora de dormir;
 * - dias seguintes: padrão completo (para continuar a funcionar sem abrir a app).
 * Cada vez que o utilizador regista água, o plano é recalculado.
 */
export function planWaterReminders(input: ReminderPlanInput): PlannedReminder[] {
  const { now, glasses, goalGlasses, wakeHour, sleepHour } = input;
  const days = input.days ?? 3;
  const result: PlannedReminder[] = [];
  const title = tr('Água');

  for (let d = 0; d < days; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const windowEndBase = new Date(atHour(day, sleepHour).getTime() - 30 * MINUTE);
    const wakeStart = new Date(atHour(day, wakeHour).getTime() + 30 * MINUTE);

    let start = wakeStart;
    let remaining = goalGlasses;
    if (d === 0) {
      remaining = goalGlasses - glasses;
      if (remaining <= 0) continue;
      start = new Date(Math.max(wakeStart.getTime(), now.getTime() + 30 * MINUTE));
    }

    const span = windowEndBase.getTime() - start.getTime();
    if (span <= 0) continue;

    const byNeed = clamp(Math.ceil(remaining / 2), 1, MAX_PER_DAY);
    const bySpace = Math.max(1, Math.floor(span / (MIN_SPACING_MIN * MINUTE)));
    const count = Math.min(byNeed, bySpace);

    evenSlots(start, windowEndBase, count).forEach((at, i) => {
      result.push({ at, title, body: pickMessage(d + i) });
    });
  }

  return result.filter((r) => r.at.getTime() > now.getTime()).sort((a, b) => a.at.getTime() - b.at.getTime());
}
