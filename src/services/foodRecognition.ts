import type { FoodAnalysis } from '../types';

/**
 * ⚠️ AVISO DE SEGURANÇA (MVP): EXPO_PUBLIC_* é embutido no bundle da app e pode ser
 * extraído. Para produção, mova esta chamada para um backend/proxy próprio.
 */
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const MODEL = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL ?? 'claude-sonnet-5-5';
const API_URL = 'https://api.anthropic.com/v1/messages';
const TIMEOUT_MS = 25000;

export const SYSTEM_PROMPT =
  "You are an expert Mozambican Nutritionist AI and core engine of 'Nutri IA'. Analyze the food image. You must accurately recognize typical Mozambican culinary dishes (e.g., matapa, xima, mucapata, caril de amendoim, cacana, badgias, peixe grelhado, etc.) and estimate the weight in grams. Return strictly a clean JSON object: { 'food_name': string, 'estimated_weight_grams': number, 'calories': number, 'carbs_g': number, 'protein_g': number, 'fats_g': number }.";

export const MOCK_VEGETABLE_SALAD: FoodAnalysis = {
  food_name: 'Vegetable Salad',
  estimated_weight_grams: 350,
  calories: 180,
  carbs_g: 22,
  protein_g: 6,
  fats_g: 8,
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
  return parsed;
}

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
}

export async function recognizeFood(imageBase64: string): Promise<RecognitionResult> {
  if (!API_KEY) {
    return { analysis: MOCK_VEGETABLE_SALAD, isFallback: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
              },
              { type: 'text', text: 'Analyze this meal. Reply with the JSON object only.' },
            ],
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as AnthropicResponse;
    const text = data.content?.find((b) => b.type === 'text')?.text ?? '';
    return { analysis: parseAnalysis(text), isFallback: false };
  } catch {
    return { analysis: MOCK_VEGETABLE_SALAD, isFallback: true };
  } finally {
    clearTimeout(timer);
  }
}
