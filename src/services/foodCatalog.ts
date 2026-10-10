import type { FoodAnalysis, IconName, Ingredient, Meal } from '../types';
import { uuidv4 } from '../utils/uuid';

interface Part {
  name: string;
  icon: IconName;
  share: number;
  /** Proteína aproximada por 100 g. */
  p100: number;
}

interface Component {
  id: string;
  keywords: string[];
  defaultGrams: number;
  /** Valores por 100 g: kcal, carboidratos, proteínas, gorduras. */
  per100: { kcal: number; carbs: number; protein: number; fats: number; fiber: number };
  parts: Part[];
}

/** Catálogo local (aproximado) de componentes típicos da culinária moçambicana. */
const COMPONENTS: Component[] = [
  {
    id: 'xima',
    keywords: ['xima', 'sadza', 'papa de milho'],
    defaultGrams: 250,
    per100: { kcal: 120, carbs: 26, protein: 2.5, fats: 0.5, fiber: 1.0 },
    parts: [{ name: 'Xima (farinha de milho)', icon: 'corn', share: 1, p100: 2.5 }],
  },
  {
    id: 'matapa',
    keywords: ['matapa'],
    defaultGrams: 150,
    per100: { kcal: 130, carbs: 8, protein: 4, fats: 9, fiber: 3 },
    parts: [
      { name: 'Folhas de mandioca', icon: 'sprout', share: 0.6, p100: 4 },
      { name: 'Amendoim e coco', icon: 'peanut', share: 0.3, p100: 14 },
      { name: 'Alho e cebola', icon: 'food-variant', share: 0.1, p100: 1.5 },
    ],
  },
  {
    id: 'mucapata',
    keywords: ['mucapata'],
    defaultGrams: 300,
    per100: { kcal: 150, carbs: 24, protein: 5, fats: 4, fiber: 4 },
    parts: [
      { name: 'Arroz', icon: 'rice', share: 0.5, p100: 2.7 },
      { name: 'Feijão nhemba', icon: 'seed', share: 0.35, p100: 8 },
      { name: 'Leite de coco', icon: 'pot-steam', share: 0.15, p100: 2 },
    ],
  },
  {
    id: 'caril-amendoim',
    keywords: ['caril', 'amendoim'],
    defaultGrams: 200,
    per100: { kcal: 190, carbs: 8, protein: 12, fats: 12, fiber: 2 },
    parts: [
      { name: 'Frango', icon: 'food-drumstick', share: 0.5, p100: 27 },
      { name: 'Molho de amendoim', icon: 'peanut', share: 0.4, p100: 12 },
      { name: 'Tomate e cebola', icon: 'food-apple', share: 0.1, p100: 1 },
    ],
  },
  {
    id: 'cacana',
    keywords: ['cacana', 'caçana'],
    defaultGrams: 200,
    per100: { kcal: 130, carbs: 28, protein: 1.5, fats: 0.5, fiber: 2.5 },
    parts: [{ name: 'Folhas de mandioca ou cacana', icon: 'leaf', share: 1, p100: 3.5 }],
  },
  {
    id: 'badgias',
    keywords: ['badgia', 'badjia', 'badjias', 'badgias'],
    defaultGrams: 120,
    per100: { kcal: 260, carbs: 28, protein: 9, fats: 12, fiber: 5 },
    parts: [
      { name: 'Feijão-nhemba', icon: 'seed', share: 0.7, p100: 8 },
      { name: 'Cebola e especiarias', icon: 'food-variant', share: 0.15, p100: 1.5 },
      { name: 'Óleo (fritura)', icon: 'bottle-tonic', share: 0.15, p100: 0 },
    ],
  },
  {
    id: 'peixe',
    keywords: ['peixe', 'tilápia', 'tilapia', 'kapenta', 'fish'],
    defaultGrams: 180,
    per100: { kcal: 140, carbs: 0, protein: 22, fats: 6, fiber: 0 },
    parts: [{ name: 'Peixe grelhado', icon: 'fish', share: 1, p100: 22 }],
  },
  {
    id: 'camarao',
    keywords: ['camarão', 'camarao', 'prawn', 'lagosta'],
    defaultGrams: 150,
    per100: { kcal: 100, carbs: 1, protein: 20, fats: 2, fiber: 0 },
    parts: [{ name: 'Camarão', icon: 'fish', share: 1, p100: 20 }],
  },
  {
    id: 'frango',
    keywords: ['frango', 'chicken'],
    defaultGrams: 180,
    per100: { kcal: 190, carbs: 0, protein: 27, fats: 9, fiber: 0 },
    parts: [{ name: 'Frango grelhado', icon: 'food-drumstick', share: 1, p100: 27 }],
  },
  {
    id: 'arroz',
    keywords: ['arroz', 'rice'],
    defaultGrams: 180,
    per100: { kcal: 130, carbs: 28, protein: 2.5, fats: 0.3, fiber: 0.4 },
    parts: [{ name: 'Arroz', icon: 'rice', share: 1, p100: 2.7 }],
  },
  {
    id: 'feijao',
    keywords: ['feijão', 'feijao', 'beans'],
    defaultGrams: 120,
    per100: { kcal: 110, carbs: 19, protein: 7, fats: 0.5, fiber: 6 },
    parts: [{ name: 'Feijão', icon: 'seed', share: 1, p100: 8 }],
  },
  {
    id: 'batata-doce',
    keywords: ['batata-doce', 'batata doce', 'mandioca'],
    defaultGrams: 200,
    per100: { kcal: 110, carbs: 26, protein: 1.3, fats: 0.2, fiber: 3 },
    parts: [{ name: 'Batata-doce / mandioca', icon: 'carrot', share: 1, p100: 1.5 }],
  },
  {
    id: 'salada',
    keywords: ['salada', 'salad', 'vegetable'],
    defaultGrams: 250,
    per100: { kcal: 45, carbs: 6, protein: 1.5, fats: 2, fiber: 1.8 },
    parts: [
      { name: 'Alface', icon: 'leaf', share: 0.35, p100: 1.2 },
      { name: 'Tomate', icon: 'food-apple', share: 0.25, p100: 0.9 },
      { name: 'Pepino', icon: 'sprout', share: 0.2, p100: 0.7 },
      { name: 'Cenoura', icon: 'carrot', share: 0.15, p100: 0.9 },
      { name: 'Azeite', icon: 'bottle-tonic', share: 0.05, p100: 0 },
    ],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function findComponents(text: string): Component[] {
  const haystack = normalize(text);
  return COMPONENTS.filter((c) => c.keywords.some((k) => haystack.includes(normalize(k))));
}

/**
 * Decompõe o prato em ingredientes (a IA devolve apenas o total, por isso a divisão
 * é estimada a partir do catálogo local, escalada para o peso total estimado).
 */
export function deriveIngredients(foodName: string, totalGrams: number): Ingredient[] {
  const matched = findComponents(foodName);
  if (matched.length === 0) {
    return [{ name: foodName, grams: Math.round(totalGrams), icon: 'food' }];
  }
  const weights = matched.map((c) => c.defaultGrams);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const result: Ingredient[] = [];
  matched.forEach((component, i) => {
    const componentGrams = (totalGrams * weights[i]) / weightSum;
    component.parts.forEach((part) => {
      result.push({
        name: part.name,
        icon: part.icon,
        grams: Math.max(1, Math.round(componentGrams * part.share)),
        p100: part.p100,
      });
    });
  });
  return result;
}

export function buildMeal(analysis: FoodAnalysis, photoUri?: string): Meal {
  return {
    id: uuidv4(),
    createdAt: Date.now(),
    analysis,
    ingredients: deriveIngredients(analysis.food_name, analysis.estimated_weight_grams),
    photoUri,
  };
}

/** Pesquisa manual: estima a refeição a partir do texto digitado, ou null se não reconhecer. */
export function analyzeFromText(query: string): FoodAnalysis | null {
  const matched = findComponents(query);
  if (matched.length === 0) return null;
  const totals = matched.reduce(
    (acc, c) => {
      const f = c.defaultGrams / 100;
      return {
        grams: acc.grams + c.defaultGrams,
        kcal: acc.kcal + c.per100.kcal * f,
        carbs: acc.carbs + c.per100.carbs * f,
        protein: acc.protein + c.per100.protein * f,
        fats: acc.fats + c.per100.fats * f,
        fiber: acc.fiber + c.per100.fiber * f,
      };
    },
    { grams: 0, kcal: 0, carbs: 0, protein: 0, fats: 0, fiber: 0 },
  );
  const name = query.trim().charAt(0).toUpperCase() + query.trim().slice(1);
  return {
    food_name: name,
    estimated_weight_grams: Math.round(totals.grams),
    calories: Math.round(totals.kcal),
    carbs_g: Math.round(totals.carbs),
    protein_g: Math.round(totals.protein),
    fats_g: Math.round(totals.fats),
    fiber_g: Math.round(totals.fiber * 10) / 10,
  };
}

export function macroPercentages(a: FoodAnalysis) {
  const c = a.carbs_g * 4;
  const p = a.protein_g * 4;
  const f = a.fats_g * 9;
  const total = c + p + f || 1;
  const carbs = Math.round((c / total) * 100);
  const protein = Math.round((p / total) * 100);
  return { carbs, protein, fats: Math.max(0, 100 - carbs - protein) };
}

export function mealIcon(meal: Meal): IconName {
  return meal.ingredients[0]?.icon ?? 'food';
}

export interface ProteinSource {
  name: string;
  grams: number;
  /** Proteína (g) atribuída a este ingrediente, ajustada ao total do prato. */
  proteinG: number;
  /** Percentagem da proteína total do prato. */
  share: number;
}

/** De onde vem a proteína do prato: reparte o total pelos ingredientes, segundo a densidade proteica. */
export function proteinSources(meal: Meal): ProteinSource[] {
  const raw = meal.ingredients.map((i) => ({ i, p: (i.grams * (i.p100 ?? 1.5)) / 100 }));
  const rawTotal = raw.reduce((s, r) => s + r.p, 0);
  if (rawTotal <= 0 || meal.analysis.protein_g <= 0) return [];
  const total = meal.analysis.protein_g;
  return raw
    .map(({ i, p }) => ({
      name: i.name,
      grams: i.grams,
      proteinG: Math.round((p / rawTotal) * total * 10) / 10,
      share: Math.round((p / rawTotal) * 100),
    }))
    .filter((s) => s.share >= 5)
    .sort((a, b) => b.proteinG - a.proteinG)
    .slice(0, 4);
}

/** Ajusta a refeição para outra porção (em gramas), escalando calorias, macros, fibras e ingredientes. */
export function scaleMeal(meal: Meal, newWeightGrams: number): Meal {
  const oldWeight = meal.analysis.estimated_weight_grams || 1;
  const k = newWeightGrams / oldWeight;
  const a = meal.analysis;
  return {
    ...meal,
    analysis: {
      ...a,
      estimated_weight_grams: Math.round(newWeightGrams),
      calories: Math.round(a.calories * k),
      carbs_g: Math.round(a.carbs_g * k),
      protein_g: Math.round(a.protein_g * k),
      fats_g: Math.round(a.fats_g * k),
      ...(a.fiber_g !== undefined ? { fiber_g: Math.round(a.fiber_g * k * 10) / 10 } : {}),
    },
    ingredients: meal.ingredients.map((i) => ({ ...i, grams: Math.max(1, Math.round(i.grams * k)) })),
  };
}

/** Pratos típicos moçambicanos (calculados com o catálogo local, funcionam sem internet). */
export const MOZ_DISHES: string[] = [
  'Xima com matapa',
  'Xima com caril de amendoim',
  'Xima com peixe grelhado',
  'Mucapata',
  'Cacana com peixe',
  'Badgias',
  'Matapa com arroz',
  'Arroz com feijão',
  'Feijão nhemba com arroz',
  'Peixe grelhado com arroz',
  'Camarão grelhado com arroz',
  'Frango grelhado com batata-doce',
  'Batata-doce cozida',
  'Salada de legumes',
];

export interface DishEntry {
  name: string;
  analysis: FoodAnalysis;
}

export function mozambicanDishes(): DishEntry[] {
  return MOZ_DISHES.map((name) => ({ name, analysis: analyzeFromText(name) })).filter(
    (d): d is DishEntry => d.analysis !== null,
  );
}
