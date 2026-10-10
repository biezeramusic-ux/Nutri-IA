import type { DailyGoals, Meal } from '../types';
import { dayKeyOf, sumMeals, weekDays, mealsOfDay } from './dayUtils';
import { todayKey } from './date';
import { computeStreak } from './streak';
import { tr } from '../i18n';

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
    (name ? tr('📊 Resumo da semana de {name} · Nutri IA', { name }) : tr('📊 Resumo da semana · Nutri IA')),
    '',
    tr('📅 Dias com registo: {days}/7 ({meals} refeições)', { days: logged.length, meals: count }),
    tr('🔥 Média: {kcal} kcal/dia (meta {goal})', { kcal: avg((t) => t.kcal), goal: goals.calories }),
    tr('💪 Proteína: {p} g · 🌾 Carbs: {c} g · 🥑 Gordura: {f} g', { p: avg((t) => t.protein), c: avg((t) => t.carbs), f: avg((t) => t.fats) }),
  ];
  if (streak.current > 0) lines.push(tr(streak.current === 1 ? '⚡ Sequência: 1 dia seguido' : '⚡ Sequência: {n} dias seguidos', { n: streak.current }));
  if (inviteCode) {
    lines.push('', tr('Experimente o Nutri IA com 3 dias grátis. Use o meu código: {code}', { code: inviteCode }));
  }
  return lines.join('\n');
}
