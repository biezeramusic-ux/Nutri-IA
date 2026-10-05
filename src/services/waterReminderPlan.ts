import type { GoalType } from '../types';

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
}

export interface PlannedReminder {
  at: Date;
  title: string;
  body: string;
}

const MINUTE = 60 * 1000;
const MIN_SPACING_MIN = 45;
const MAX_PER_DAY = 6;

const MESSAGES: Record<GoalType | 'generic', string[]> = {
  lose_weight: [
    'Um copo de água antes de comer ajuda a controlar a fome.',
    'Muitas vezes a sede parece fome. Beba um copo e espere 10 minutos.',
    'Beber água ao longo do dia ajuda no seu plano de perda de peso.',
    'Está a ir bem! Mais um copo para continuar o seu plano.',
  ],
  maintain: [
    'Mantenha o ritmo: um copo de água agora faz bem.',
    'Hidratação em dia ajuda a manter o peso e a energia.',
    'Pequenos hábitos fazem a diferença. Beba um copo de água.',
  ],
  gain_muscle: [
    'A hidratação ajuda a recuperação dos músculos. Beba um copo.',
    'Para ganhar massa, a água é tão importante como a proteína.',
    'Músculos precisam de água. Hora de um copo!',
  ],
  eat_healthy: [
    'A água é a bebida mais saudável. Beba um copo!',
    'Comer bem começa por beber bem. Um copo de água agora?',
    'O seu corpo agradece: beba um copo de água.',
  ],
  track_calories: [
    'Já registou as suas refeições? Aproveite e beba um copo de água.',
    'Água não tem calorias e ajuda a sentir-se bem. Beba um copo!',
    'Hoje está quente em Moçambique. Um copo de água faz bem.',
  ],
  generic: ['Hora de beber água! O seu corpo agradece.', 'Um copo de água agora faz bem.'],
};

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

function pickMessage(goal: GoalType | null, index: number): string {
  const bank = MESSAGES[goal ?? 'generic'];
  return bank[index % bank.length];
}

function glassesWord(n: number): string {
  return n === 1 ? '1 copo' : `${n} copos`;
}

/**
 * Planeia os lembretes de água a partir do progresso atual:
 * - hoje: só se ainda faltar água; espaçados entre agora e a hora de dormir;
 * - dias seguintes: padrão completo (para continuar a funcionar sem abrir a app).
 * Cada vez que o utilizador regista água, o plano é recalculado.
 */
export function planWaterReminders(input: ReminderPlanInput): PlannedReminder[] {
  const { now, glasses, goalGlasses, wakeHour, sleepHour, goal, firstName } = input;
  const days = input.days ?? 3;
  const result: PlannedReminder[] = [];
  const title = '💧 Hora de beber água';

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
      const name = firstName && i % 2 === 0 ? `${firstName}, ` : '';
      const core =
        d === 0 && i === 0
          ? `Faltam ${glassesWord(remaining)} para a sua meta de hoje. ${pickMessage(goal, i)}`
          : pickMessage(goal, d + i);
      result.push({ at, title, body: name ? `${name}${core.charAt(0).toLowerCase()}${core.slice(1)}` : core });
    });
  }

  return result.filter((r) => r.at.getTime() > now.getTime()).sort((a, b) => a.at.getTime() - b.at.getTime());
}
