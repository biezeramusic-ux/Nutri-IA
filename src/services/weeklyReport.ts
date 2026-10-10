import type { DailyGoals, Meal } from '../types';
import { dayKeyOf, sumMeals, weekDays, mealsOfDay } from './dayUtils';
import { todayKey } from './date';
import { computeStreak } from './streak';

/** Texto do resumo da semana, pronto a partilhar (WhatsApp, etc.). */
export function buildWeeklyReport(meals: Meal[], goals: DailyGoals, name: string, inviteCode?: string): string {
  const days = weekDays(new Date());
  const perDay = days.map((d) => sumMeals(mealsOfDay(meals, todayKey(d))));
  const logged = perDay.filter((t) => t.kcal > 0);
  const n = Math.max(logged.length, 1);
  const avg = (pick: (t: (typeof perDay)[number]) => number) => Math.round(logged.reduce((s, t) => s + pick(t), 0) / n);
  const weekKeys = new Set(days.map((d) => todayKey(d)));
  const count = meals.filter((m) => weekKeys.has(dayKeyOf(m.createdAt))).length;
  const streak = computeStreak(meals);

  const lines = [
    `📊 Resumo da semana${name ? ` de ${name}` : ''} · Nutri IA`,
    '',
    `📅 Dias com registo: ${logged.length}/7 (${count} refeições)`,
    `🔥 Média: ${avg((t) => t.kcal)} kcal/dia (meta ${goals.calories})`,
    `💪 Proteína: ${avg((t) => t.protein)} g · 🌾 Carbs: ${avg((t) => t.carbs)} g · 🥑 Gordura: ${avg((t) => t.fats)} g`,
  ];
  if (streak.current > 0) lines.push(`⚡ Sequência: ${streak.current} ${streak.current === 1 ? 'dia' : 'dias'} seguidos`);
  if (inviteCode) {
    lines.push('', `Experimente o Nutri IA com 3 dias grátis. Use o meu código: ${inviteCode}`);
  }
  return lines.join('\n');
}
