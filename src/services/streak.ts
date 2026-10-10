import type { Meal } from '../types';
import { dayKeyOf } from './dayUtils';
import { todayKey } from './date';

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export interface StreakInfo {
  /** Dias seguidos a registar (conta até ontem, se hoje ainda não registou). */
  current: number;
  best: number;
  /** Já registou hoje? */
  today: boolean;
  nextMilestone: number | null;
}

const keyOffset = (key: string, days: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  return todayKey(new Date(y, m - 1, d + days));
};

export function computeStreak(meals: Meal[], now = new Date()): StreakInfo {
  const days = new Set(meals.map((m) => dayKeyOf(m.createdAt)));
  const today = todayKey(now);
  const hasToday = days.has(today);

  let current = 0;
  let cursor = hasToday ? today : keyOffset(today, -1);
  while (days.has(cursor)) {
    current += 1;
    cursor = keyOffset(cursor, -1);
  }

  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    run = prev && keyOffset(prev, 1) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }

  const nextMilestone = STREAK_MILESTONES.find((m) => m > current) ?? null;
  return { current, best, today: hasToday, nextMilestone };
}
