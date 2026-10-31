/** Cerca de 7 700 kcal de défice ou excesso equivalem a 1 kg de peso. */
export const KCAL_PER_KG = 7700;

export interface EstimatePoint {
  day: string;
  kg: number;
}

const nextDay = (key: string): string => {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(y, m - 1, d + 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

/**
 * Estima o peso dia a dia a partir do último peso registado: cada dia com refeições registadas soma
 * (calorias comidas − calorias gastas em repouso − calorias gastas em treinos e atividades) / 7 700.
 * Dias sem refeições registadas não contam (não se sabe quanto comeu). É só uma estimativa.
 */
export function estimateWeight(input: {
  anchorDay: string;
  anchorKg: number;
  today: string;
  eatenByDay: Record<string, number>;
  burnByDay: Record<string, number>;
  restKcal: number;
}): EstimatePoint[] {
  const out: EstimatePoint[] = [];
  let kg = input.anchorKg;
  let day = input.anchorDay;
  let guard = 0;
  while (day < input.today && guard++ < 800) {
    day = nextDay(day);
    const eaten = input.eatenByDay[day];
    if (eaten !== undefined && eaten > 0) {
      const balance = Math.max(-2500, Math.min(2500, eaten - input.restKcal - (input.burnByDay[day] ?? 0)));
      kg += balance / KCAL_PER_KG;
    }
    out.push({ day, kg: Math.round(kg * 10) / 10 });
  }
  return out;
}
