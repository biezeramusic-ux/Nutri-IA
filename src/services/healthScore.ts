import type { DailyGoals, FoodAnalysis, GoalType, MealType } from '../types';

export interface HealthScore {
  /** 0 a 10. */
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

/** Parte das calorias do dia que cabe a cada refeição. */
const MEAL_SHARE: Record<MealType, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.1, dinner: 0.3 };

/**
 * Nota de 0 a 10 do prato de acordo com a meta da pessoa: parte da qualidade do prato (equilíbrio, fibras, gordura)
 * e ajusta pelas calorias e proteína que esta refeição devia ter para cumprir a meta diária e o objetivo.
 */
export function mealScoreForGoal(a: FoodAnalysis, goals: DailyGoals, goal: GoalType | null, type: MealType): HealthScore {
  const base = mealScore(a);
  const share = MEAL_SHARE[type];
  const kcalRatio = a.calories / Math.max(goals.calories * share, 1);
  const proteinRatio = a.protein_g / Math.max(goals.proteinG * share, 1);
  let score = base.score;
  let tip = base.tip;

  // Calorias face ao que esta refeição devia ter.
  if (kcalRatio > 1.15) {
    score -= goal === 'lose_weight' ? Math.min(4, (kcalRatio - 1.15) * 6) : Math.min(3, (kcalRatio - 1.15) * 4);
    tip = 'Muitas calorias para a sua meta nesta refeição.';
  } else if (kcalRatio < 0.45) {
    score -= goal === 'gain_muscle' ? 2.5 : 1;
    tip = 'Poucas calorias para a sua meta nesta refeição.';
  } else if (kcalRatio >= 0.8 && kcalRatio <= 1.15) {
    score += 1;
  }

  // Proteína face ao que esta refeição devia ter.
  if (proteinRatio < 0.5) {
    score -= goal === 'gain_muscle' ? 2 : 1;
    if (tip === base.tip) tip = 'Pouca proteína para a sua meta de hoje.';
  } else if (proteinRatio >= 0.85) {
    score += goal === 'gain_muscle' || goal === 'lose_weight' ? 1 : 0.5;
  }

  const value = Math.max(0, Math.min(10, Math.round(score)));
  const label = value >= 8 ? 'Muito equilibrada' : value >= 6 ? 'Boa escolha' : value >= 4 ? 'Pode melhorar' : 'Pouco equilibrada';
  return { score: value, label, tip };
}

export function dayScore(meals: FoodAnalysis[]): number | null {
  if (meals.length === 0) return null;
  const sum = meals.reduce((s, m) => s + mealScore(m).score, 0);
  return Math.round((sum / meals.length) * 10) / 10;
}
