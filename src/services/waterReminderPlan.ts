import type { ActivityLevel, GoalType, Habits, QuizAnswers } from '../types';
import { tr } from '../i18n';
import { GLASS_ML } from './goals';
import { personalize } from './reminderText';

/** Dados do quiz que personalizam os horários da água. */
export interface WaterProfile {
  activity?: ActivityLevel;
  habits?: Partial<Pick<Habits, 'drinksEnoughWater' | 'sugaryDrinks'>>;
  /** Número estável por pessoa (peso, idade...) que desloca alguns minutos, para cada pessoa ter horas próprias. */
  seed?: number;
}

/** Extrai do quiz os dados que personalizam os lembretes. */
export function waterProfileFromQuiz(quiz?: QuizAnswers | null): WaterProfile {
  if (!quiz) return {};
  return {
    activity: quiz.activity,
    habits: { drinksEnoughWater: quiz.habits?.drinksEnoughWater, sugaryDrinks: quiz.habits?.sugaryDrinks },
    seed: quiz.weightKg * 7 + quiz.age * 3,
  };
}

export interface ReminderPlanInput extends WaterProfile {
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
const MAX_PER_DAY = 8;

/** Primeira linha: pede para beber água e cuidar da hidratação. */
const SIMPLE_MESSAGES = [
  '{name}, beba água para cuidar da sua hidratação.',
  '{name}, está na hora de um copo de água: cuide da sua hidratação.',
  'Lembrete, {name}: beba água e cuide da sua hidratação.',
];

/** Porquê beber: ligado ao objetivo da pessoa. */
function why(goal: GoalType | null): string {
  if (goal === 'lose_weight') return tr('Ajuda a controlar a fome e a queimar gordura mais depressa.');
  if (goal === 'gain_muscle') return tr('Ajuda a recuperar os músculos e a ganhar massa mais depressa.');
  return tr('Ajuda a manter a energia e a chegar mais depressa ao seu objetivo.');
}

/** Mililitros recomendados por lembrete: o que falta da meta repartido pelos avisos que restam (arredondado a 50 ml). */
export function mlPerReminder(missingMl: number, remainingReminders: number): number {
  const raw = missingMl / Math.max(1, remainingReminders);
  return Math.min(500, Math.max(100, Math.round(raw / 50) * 50));
}

function pickMessage(index: number, ml: number, goal: GoalType | null, name?: string): string {
  const first = personalize(tr(SIMPLE_MESSAGES[index % SIMPLE_MESSAGES.length]), name);
  return `${first}\n${tr('Recomendamos cerca de {ml} ml agora.', { ml })} ${why(goal)}`;
}

/**
 * Quantos lembretes por dia, a partir das respostas do quiz: a meta de água manda;
 * quem treina mais, bebe pouca água ou toma bebidas açucaradas recebe mais lembretes.
 */
export function waterRemindersPerDay(goalGlasses: number, p: WaterProfile): number {
  let n = Math.ceil(goalGlasses / 2);
  if (p.activity === 'very_active') n += 2;
  else if (p.activity === 'moderate') n += 1;
  if (p.habits?.drinksEnoughWater === false) n += 1;
  if (p.habits?.sugaryDrinks === true) n += 1;
  return Math.max(3, Math.min(MAX_PER_DAY, n));
}

/**
 * Horas (minutos desde as 00:00) dos lembretes de um dia: o primeiro pouco depois de acordar,
 * o último duas horas antes de dormir, os outros bem repartidos. Cada pessoa tem um pequeno desvio próprio.
 */
export function waterMinutesOfDay(input: Pick<ReminderPlanInput, 'wakeHour' | 'sleepHour' | 'goalGlasses'> & WaterProfile): number[] {
  const count = waterRemindersPerDay(input.goalGlasses, input);
  const start = input.wakeHour * 60 + 45;
  const end = Math.max(start + 60, input.sleepHour * 60 - 120);
  const shift = Math.abs(Math.round(input.seed ?? 0)) % 21; // 0 a 20 min
  return Array.from({ length: count }, (_, i) => {
    const base = count === 1 ? start : start + ((end - start) * i) / (count - 1);
    // O primeiro fica logo depois de acordar; os restantes levam o desvio da pessoa.
    return Math.round(i === 0 ? base : Math.min(end, base + shift - 10));
  });
}

/** "07:45", "10:20"... para mostrar à pessoa. */
export const formatMinutes = (m: number): string => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * Planeia os lembretes de água a partir da rotina e das respostas do quiz:
 * - hoje: só os que ainda não passaram e enquanto faltar água;
 * - dias seguintes: o padrão completo (para continuar a funcionar sem abrir a app).
 * Cada vez que o utilizador regista água, o plano é recalculado.
 */
export function planWaterReminders(input: ReminderPlanInput): PlannedReminder[] {
  const { now, glasses, goalGlasses } = input;
  const days = input.days ?? 3;
  const title = tr('Água');
  const minutes = waterMinutesOfDay(input);
  const result: PlannedReminder[] = [];
  const goalMl = goalGlasses * GLASS_ML;

  for (let d = 0; d < days; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    let times = minutes.map((m) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, m, 0, 0));
    if (d === 0) {
      const remaining = goalGlasses - glasses;
      if (remaining <= 0) continue;
      times = times.filter((t) => t.getTime() > now.getTime() + 5 * MINUTE).slice(0, Math.max(1, remaining));
    }
    const missingMl = d === 0 ? Math.max(0, goalGlasses - glasses) * GLASS_ML : goalMl;
    const ml = mlPerReminder(missingMl, times.length);
    times.forEach((at, i) => result.push({ at, title, body: pickMessage(d + i, ml, input.goal, input.firstName) }));
  }

  return result.filter((r) => r.at.getTime() > now.getTime()).sort((a, b) => a.at.getTime() - b.at.getTime());
}
