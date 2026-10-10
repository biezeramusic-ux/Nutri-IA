import type { FoodAnalysis } from '../types';
import { supabase } from './supabase';

export const MOCK_VEGETABLE_SALAD: FoodAnalysis = {
  food_name: 'Salada de legumes',
  estimated_weight_grams: 350,
  calories: 180,
  carbs_g: 22,
  protein_g: 6,
  fats_g: 8,
  confidence: 70,
  fiber_g: 5,
};

export interface RecognitionResult {
  analysis: FoodAnalysis;
  /** true quando foi usado o mock (sem rede, sem chave ou resposta inválida). */
  isFallback: boolean;
}

function isFoodAnalysis(value: unknown): value is FoodAnalysis {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.food_name === 'string' &&
    v.food_name.length > 0 &&
    ['estimated_weight_grams', 'calories', 'carbs_g', 'protein_g', 'fats_g'].every(
      (k) => typeof v[k] === 'number' && Number.isFinite(v[k] as number),
    )
  );
}

/** Extrai o primeiro objeto JSON da resposta (tolera cercas ```json). */
function parseAnalysis(text: string): FoodAnalysis {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Resposta sem JSON');
  const parsed: unknown = JSON.parse(text.slice(start, end + 1));
  if (!isFoodAnalysis(parsed)) throw new Error('JSON fora do formato esperado');
  const confidence = (parsed as { confidence?: unknown }).confidence;
  const fiber = (parsed as { fiber_g?: unknown }).fiber_g;
  return {
    ...parsed,
    ...(typeof fiber === 'number' && fiber >= 0 ? { fiber_g: fiber } : {}),
    ...(typeof confidence === 'number' && confidence >= 0 && confidence <= 100
      ? { confidence: Math.round(confidence) }
      : {}),
  };
}

export interface ScanOutcome extends RecognitionResult {
  /** false quando o servidor recusou o scan (teste terminado / limite diário). */
  allowed: boolean;
}

/**
 * Reconhece o prato através da Edge Function "ai" (Gemini). O servidor também valida e consome
 * o scan do plano. Sem função publicada ou sem rede, devolve um exemplo e não consome scans.
 */
export async function recognizeFood(imageBase64: string): Promise<ScanOutcome> {
  try {
    const { data, error } = await supabase.functions.invoke('ai', { body: { action: 'scan', image: imageBase64 } });
    if (error || !data) throw new Error('ai_unavailable');
    if (data.allowed === false) return { allowed: false, analysis: MOCK_VEGETABLE_SALAD, isFallback: true };
    return { allowed: true, analysis: parseAnalysis(String(data.text ?? '')), isFallback: false };
  } catch {
    return { allowed: true, analysis: MOCK_VEGETABLE_SALAD, isFallback: true };
  }
}

export type RefineOutcome =
  | { status: 'ok'; analysis: FoodAnalysis }
  | { status: 'blocked' }
  | { status: 'unavailable' };

/** Corrige a análise com um texto do utilizador ("foi sem arroz"), através da função "ai". */
export async function refineAnalysis(current: FoodAnalysis, instruction: string): Promise<RefineOutcome> {
  try {
    const { data, error } = await supabase.functions.invoke('ai', { body: { action: 'refine', analysis: current, instruction } });
    if (error || !data) return { status: 'unavailable' };
    if (data.allowed === false) return { status: 'blocked' };
    return { status: 'ok', analysis: parseAnalysis(String(data.text ?? '')) };
  } catch {
    return { status: 'unavailable' };
  }
}
