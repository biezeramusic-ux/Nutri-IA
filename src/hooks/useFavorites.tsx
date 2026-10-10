import { useCallback, useEffect, useState } from 'react';
import { addFavorite, loadFavorites, removeFavorite, type FavoriteMeal } from '../services/favorites';
import type { Meal } from '../types';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);

  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      return;
    }
    void loadFavorites(userId).then(setFavorites);
  }, [userId]);

  const add = useCallback(
    async (meal: Meal) => {
      if (userId) setFavorites(await addFavorite(userId, meal));
    },
    [userId],
  );
  const remove = useCallback(
    async (id: string) => {
      if (userId) setFavorites(await removeFavorite(userId, id));
    },
    [userId],
  );
  const isFavorite = useCallback(
    (meal: Meal) => favorites.some((f) => f.analysis.food_name.trim().toLowerCase() === meal.analysis.food_name.trim().toLowerCase()),
    [favorites],
  );

  return { favorites, add, remove, isFavorite };
}
