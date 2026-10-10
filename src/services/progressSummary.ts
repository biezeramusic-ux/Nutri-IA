import type { GoalType } from '../types';
import { tr } from '../i18n';

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
    return tr(i.periodLabel === 'semana' ? 'Ainda não há refeições registadas nesta semana. Fotografe a sua próxima refeição para começar a ver o progresso.' : 'Ainda não há refeições registadas neste mês. Fotografe a sua próxima refeição para começar a ver o progresso.');
  }
  const parts: string[] = [];
  const ratio = i.avgKcal / i.goalKcal;
  if (ratio < 0.8) parts.push(tr('Em média comeu abaixo da meta de calorias ({pct}%).', { pct: Math.round(ratio * 100) }));
  else if (ratio <= 1.1) parts.push(tr('Manteve-se dentro da meta de calorias. Bom trabalho.'));
  else parts.push(tr('Em média ultrapassou a meta de calorias em {pct}%.', { pct: Math.round((ratio - 1) * 100) }));

  if (i.avgProtein < i.goalProtein * 0.8) {
    parts.push(tr('A proteína ficou baixa: tente incluir peixe, feijão ou ovos.'));
  } else {
    parts.push(tr('A ingestão de proteína está boa.'));
  }

  if (i.weightDelta !== null && Math.abs(i.weightDelta) >= 0.1) {
    const down = i.weightDelta < 0;
    const wantsDown = i.goal === 'lose_weight';
    const wantsUp = i.goal === 'gain_muscle';
    const tail = (down && wantsDown) || (!down && wantsUp) ? ' ' + tr('Está no caminho certo.') : '';
    parts.push(tr(down ? 'O seu peso desceu {kg} kg.' : 'O seu peso subiu {kg} kg.', { kg: fmt(i.weightDelta) }) + tail);
  }
  return parts.join(' ');
}
