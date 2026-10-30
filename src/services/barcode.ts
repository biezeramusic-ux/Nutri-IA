import type { FoodAnalysis } from '../types';

interface OffProduct {
  product_name?: string;
  product_name_pt?: string;
  generic_name?: string;
  brands?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined;
};

export type BarcodeOutcome = { status: 'ok'; analysis: FoodAnalysis } | { status: 'not_found' } | { status: 'offline' };

/** Procura um produto embalado no Open Food Facts (base pública, sem chave) e devolve os valores por porção. */
export async function lookupBarcode(code: string): Promise<BarcodeOutcome> {
  let product: OffProduct | undefined;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_pt,generic_name,brands,serving_quantity,nutriments`,
      { headers: { 'User-Agent': 'NutrifitnessAI/1.0 (mz.nutrifitness.app)' } },
    );
    if (!res.ok && res.status !== 404) return { status: 'offline' };
    const json = (await res.json()) as { status?: number; product?: OffProduct };
    product = json.status === 1 ? json.product : undefined;
  } catch {
    return { status: 'offline' };
  }
  const n = product?.nutriments;
  const kcal100 = num(n?.['energy-kcal_100g']) ?? (num(n?.['energy_100g']) !== undefined ? Math.round((num(n?.['energy_100g']) as number) / 4.184) : undefined);
  if (!product || !n || kcal100 === undefined) return { status: 'not_found' };

  const grams = num(product.serving_quantity) && (num(product.serving_quantity) as number) > 0 ? (num(product.serving_quantity) as number) : 100;
  const f = grams / 100;
  const per = (key: string, digits = 1): number | undefined => {
    const v = num(n[`${key}_100g`]);
    return v === undefined ? undefined : Math.round(v * f * 10 ** digits) / 10 ** digits;
  };
  const name = (product.product_name_pt || product.product_name || product.generic_name || 'Produto').trim();
  const brand = product.brands?.split(',')[0]?.trim();
  const sodiumG = num(n['sodium_100g']);
  const analysis: FoodAnalysis = {
    food_name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name,
    estimated_weight_grams: Math.round(grams),
    calories: Math.round(kcal100 * f),
    carbs_g: per('carbohydrates') ?? 0,
    protein_g: per('proteins') ?? 0,
    fats_g: per('fat') ?? 0,
    confidence: 100,
    ...(per('fiber') !== undefined ? { fiber_g: per('fiber') } : {}),
    ...(per('sugars') !== undefined ? { sugar_g: per('sugars') } : {}),
    ...(per('saturated-fat') !== undefined ? { saturated_fat_g: per('saturated-fat') } : {}),
    ...(sodiumG !== undefined ? { sodium_mg: Math.round(sodiumG * 1000 * f) } : {}),
    ...(per('calcium') !== undefined ? { calcium_mg: Math.round((per('calcium', 3) as number) * 1000) } : {}),
    ...(per('iron') !== undefined ? { iron_mg: Math.round((per('iron', 4) as number) * 1000 * 10) / 10 } : {}),
  };
  return { status: 'ok', analysis };
}
