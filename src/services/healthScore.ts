import type { FoodAnalysis } from '../types';

export interface HealthScore {
  /** 1 a 10. */
  score: number;
  label: string;
  tip: string;
}

/**
 * Pontuação simples (regras locais, sem IA) do equilíbrio de uma refeição:
 * proteína suficiente, pouca gordura/açúcar escondido, fibras e densidade calórica moderada.
 */
export function mealScore(a: FoodAnalysis): HealthScore {
  const kcal = Math.max(a.calories, 1);
  const protein = (a.protein_g * 4) / kcal;
  const fats = (a.fats_g * 9) / kcal;
  const carbs = (a.carbs_g * 4) / kcal;
  const density = kcal / Math.max(a.estimated_weight_grams, 1);
  const fiber = a.fiber_g ?? 0;

  let score = 5;
  const tips: string[] = [];

  if (protein >= 0.15 && protein <= 0.4) score += 1.5;
  else if (protein < 0.1) {
    score -= 1;
    tips.push('Falta proteína: junte peixe, feijão, ovo ou frango.');
  }
  if (fats > 0.45) {
    score -= 1.5;
    tips.push('Muita gordura: prefira grelhado ou cozido.');
  } else if (fats <= 0.35) score += 0.5;
  if (carbs > 0.7) {
    score -= 1;
    tips.push('Muitos carboidratos: acrescente legumes ou verduras.');
  }
  if (fiber >= 5) score += 1.5;
  else if (fiber >= 3) score += 0.8;
  else tips.push('Pouca fibra: legumes, folhas e feijão ajudam.');
  if (density > 3.2) score -= 1;
  else if (density < 2) score += 0.5;

  const value = Math.max(1, Math.min(10, Math.round(score)));
  const label = value >= 8 ? 'Muito equilibrada' : value >= 6 ? 'Boa escolha' : value >= 4 ? 'Pode melhorar' : 'Pouco equilibrada';
  const tip = tips[0] ?? 'Boa combinação de nutrientes. Continue assim.';
  return { score: value, label, tip };
}

export function dayScore(meals: FoodAnalysis[]): number | null {
  if (meals.length === 0) return null;
  const sum = meals.reduce((s, m) => s + mealScore(m).score, 0);
  return Math.round((sum / meals.length) * 10) / 10;
}
