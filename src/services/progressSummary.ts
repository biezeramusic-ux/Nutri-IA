import type { GoalType } from '../types';

interface Input {
  daysLogged: number;
  avgKcal: number;
  goalKcal: number;
  avgProtein: number;
  goalProtein: number;
  /** Variação de peso no período (kg), ou null se não houver registos suficientes. */
  weightDelta: number | null;
  goal: GoalType | null;
  periodLabel: 'semana' | 'mês';
}

const fmt = (n: number) => Math.abs(n).toFixed(1).replace('.', ',');

/** Resumo em linguagem simples (regras locais; a IA pode substituir este texto mais tarde). */
export function buildProgressSummary(i: Input): string {
  if (i.daysLogged === 0) {
    return `Ainda não há refeições registadas nesta ${i.periodLabel === 'semana' ? 'semana' : 'este mês'}. Fotografe a sua próxima refeição para começar a ver o progresso.`;
  }
  const parts: string[] = [];
  const ratio = i.avgKcal / i.goalKcal;
  if (ratio < 0.8) parts.push(`Em média comeu abaixo da meta de calorias (${Math.round(ratio * 100)}%).`);
  else if (ratio <= 1.1) parts.push('Manteve-se dentro da meta de calorias. Bom trabalho.');
  else parts.push(`Em média ultrapassou a meta de calorias em ${Math.round((ratio - 1) * 100)}%.`);

  if (i.avgProtein < i.goalProtein * 0.8) {
    parts.push('A proteína ficou baixa: tente incluir peixe, feijão ou ovos.');
  } else {
    parts.push('A ingestão de proteína está boa.');
  }

  if (i.weightDelta !== null && Math.abs(i.weightDelta) >= 0.1) {
    const down = i.weightDelta < 0;
    const wantsDown = i.goal === 'lose_weight';
    const wantsUp = i.goal === 'gain_muscle';
    const tail = (down && wantsDown) || (!down && wantsUp) ? ' Está no caminho certo.' : '';
    parts.push(`O seu peso ${down ? 'desceu' : 'subiu'} ${fmt(i.weightDelta)} kg.${tail}`);
  }
  return parts.join(' ');
}
