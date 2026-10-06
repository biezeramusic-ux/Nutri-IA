import type { IconName, Ingredient, Meal } from '../../types';
import { compressForStorage } from '../imageCompressor';
import { getLocalPhotoUri, persistLocalPhoto } from '../localPhotos';
import type { Database, Json } from '../database.types';
import { supabase } from '../supabase';

const BUCKET = 'meal-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type MealRow = Database['public']['Tables']['meals']['Row'];

function parseIngredients(value: Json): Ingredient[] {
  if (!Array.isArray(value)) return [];
  const result: Ingredient[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
    const { name, grams, icon, p100 } = item;
    if (typeof name === 'string' && typeof grams === 'number' && typeof icon === 'string') {
      result.push({ name, grams, icon: icon as IconName, ...(typeof p100 === 'number' ? { p100 } : {}) });
    }
  }
  return result;
}

function rowToMeal(row: MealRow, photoUri?: string): Meal {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    analysis: {
      food_name: row.food_name,
      estimated_weight_grams: row.weight_g,
      calories: row.calories,
      carbs_g: row.carbs_g,
      protein_g: row.protein_g,
      fats_g: row.fats_g,
      ...(row.confidence !== null ? { confidence: row.confidence } : {}),
      ...(row.fiber_g !== null ? { fiber_g: row.fiber_g } : {}),
    },
    ingredients: parseIngredients(row.ingredients),
    photoUri,
  };
}

/** Lista as refeições mais recentes, com URLs temporárias para as fotos privadas. */
export async function listMeals(limit = 50): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  // Foto original guardada no telemóvel tem prioridade; só as restantes usam a cópia de 50 KB da nuvem.
  const localById = new Map<string, string>();
  data.forEach((r) => {
    const local = getLocalPhotoUri(r.id);
    if (local) localById.set(r.id, local);
  });
  const paths = data.flatMap((r) => (r.photo_path && !localById.has(r.id) ? [r.photo_path] : []));
  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const signed = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    signed.data?.forEach((entry) => {
      if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
    });
  }
  return data.map((row) =>
    rowToMeal(row, localById.get(row.id) ?? (row.photo_path ? urlByPath.get(row.photo_path) : undefined)),
  );
}

/** Comprime a foto para ~50 KB e envia-a. Falhas aqui não impedem de guardar a refeição. */
async function uploadPhoto(userId: string, mealId: string, uri: string): Promise<string | null> {
  try {
    const small = await compressForStorage(uri);
    const bytes = await (await fetch(small.uri)).arrayBuffer();
    const path = `${userId}/${mealId}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    return error ? null : path;
  } catch {
    return null;
  }
}

const UNIQUE_VIOLATION = '23505';

/** Guarda a refeição (e a foto). Devolve a refeição guardada; é idempotente por id. */
export async function insertMeal(userId: string, meal: Meal): Promise<Meal> {
  // A foto original fica no telemóvel; para a nuvem vai a versão de ~50 KB.
  const localUri = meal.photoUri ? persistLocalPhoto(meal.id, meal.photoUri) : undefined;
  const photoPath = meal.photoUri ? await uploadPhoto(userId, meal.id, meal.photoUri) : null;
  const { analysis } = meal;
  const { error } = await supabase.from('meals').insert({
    id: meal.id,
    user_id: userId,
    food_name: analysis.food_name,
    weight_g: analysis.estimated_weight_grams,
    calories: analysis.calories,
    carbs_g: analysis.carbs_g,
    protein_g: analysis.protein_g,
    fats_g: analysis.fats_g,
    ingredients: meal.ingredients.map((i) => ({ name: i.name, grams: i.grams, icon: i.icon as string, p100: i.p100 ?? null })),
    confidence: analysis.confidence ?? null,
    fiber_g: analysis.fiber_g ?? null,
    photo_path: photoPath,
    created_at: new Date(meal.createdAt).toISOString(),
  });
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(error.message);
  return localUri ? { ...meal, photoUri: localUri } : meal;
}

/** Apaga uma refeição do diário. */
export async function deleteMealById(id: string): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
