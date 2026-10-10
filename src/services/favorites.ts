import AsyncStorage from '@react-native-async-storage/async-storage';
import { uuidv4 } from '../utils/uuid';
import type { FoodAnalysis, Ingredient, Meal } from '../types';

export interface FavoriteMeal {
  id: string;
  analysis: FoodAnalysis;
  ingredients: Ingredient[];
  savedAt: number;
}

const keyFor = (userId: string) => `nutria.favorites.${userId}`;
const MAX_FAVORITES = 50;

export async function loadFavorites(userId: string): Promise<FavoriteMeal[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as FavoriteMeal[]) : [];
  } catch {
    return [];
  }
}

async function persist(userId: string, items: FavoriteMeal[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(items.slice(0, MAX_FAVORITES)));
}

const sameDish = (a: FoodAnalysis, b: FoodAnalysis) =>
  a.food_name.trim().toLowerCase() === b.food_name.trim().toLowerCase();

export async function addFavorite(userId: string, meal: Meal): Promise<FavoriteMeal[]> {
  const current = await loadFavorites(userId);
  const next = [
    { id: uuidv4(), analysis: meal.analysis, ingredients: meal.ingredients, savedAt: Date.now() },
    ...current.filter((f) => !sameDish(f.analysis, meal.analysis)),
  ];
  await persist(userId, next);
  return next;
}

export async function removeFavorite(userId: string, id: string): Promise<FavoriteMeal[]> {
  const next = (await loadFavorites(userId)).filter((f) => f.id !== id);
  await persist(userId, next);
  return next;
}

/** Cria uma refeição nova (com data de agora) a partir de uma favorita. */
export function favoriteToMeal(fav: FavoriteMeal): Meal {
  return { id: uuidv4(), createdAt: Date.now(), analysis: fav.analysis, ingredients: fav.ingredients };
}
