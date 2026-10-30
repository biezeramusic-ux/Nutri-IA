// Edge Function "ai": reconhecimento de pratos (scanner) e resumo de progresso, via Gemini.
// A chave GEMINI_API_KEY fica só no Supabase (Secrets) — nunca na app.
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
// Lista de modelos por ordem de preferência (separados por vírgula). Se um for desativado (404),
// a função tenta o seguinte, por isso a app não pára quando o Google retira um modelo.
const MODELS = (Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite,gemini-2.5-flash-lite')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
const geminiUrl = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCAN_PROMPT =
  "You are an expert Mozambican Nutritionist AI and core engine of 'Nutrifitness AI'. Analyze the food image. You must accurately recognize typical Mozambican culinary dishes (e.g., matapa, xima, mucapata, caril de amendoim, cacana, badgias, peixe grelhado, etc.) and estimate the weight in grams. Return strictly a clean JSON object: { \"food_name\": string, \"estimated_weight_grams\": number, \"calories\": number, \"carbs_g\": number, \"protein_g\": number, \"fats_g\": number, \"fiber_g\": number, \"sugar_g\": number, \"added_sugar_g\": number, \"saturated_fat_g\": number, \"trans_fat_g\": number, \"polyunsaturated_fat_g\": number, \"monounsaturated_fat_g\": number, \"cholesterol_mg\": number, \"sodium_mg\": number, \"calcium_mg\": number, \"iron_mg\": number, \"potassium_mg\": number, \"vitamin_a_iu\": number, \"vitamin_c_mg\": number, \"vitamin_d_iu\": number, \"health_analysis\": string, \"confidence\": number }. Write food_name in Portuguese (Mozambique). confidence is 0 to 100. All nutrient values are estimates for the whole portion shown (grams for *_g, milligrams for *_mg, IU for *_iu). health_analysis is 2 to 4 short, friendly sentences about how balanced the dish is (calories, protein, fats, sugar, sodium, fibre), without medical claims or diagnoses.";

const REFINE_PROMPT =
  "You are the Nutrifitness AI nutritionist. You receive the current analysis of a meal (JSON) and a correction written by the user in Portuguese (e.g. 'foi sem arroz', 'a porção era maior', 'é xima com peixe'). Apply the correction and return strictly a clean JSON object with the same fields: { \"food_name\": string, \"estimated_weight_grams\": number, \"calories\": number, \"carbs_g\": number, \"protein_g\": number, \"fats_g\": number, \"fiber_g\": number, \"sugar_g\": number, \"added_sugar_g\": number, \"saturated_fat_g\": number, \"trans_fat_g\": number, \"polyunsaturated_fat_g\": number, \"monounsaturated_fat_g\": number, \"cholesterol_mg\": number, \"sodium_mg\": number, \"calcium_mg\": number, \"iron_mg\": number, \"potassium_mg\": number, \"vitamin_a_iu\": number, \"vitamin_c_mg\": number, \"vitamin_d_iu\": number, \"health_analysis\": string, \"confidence\": number }. Keep food_name in Portuguese (Mozambique), update health_analysis to match the corrected dish, and keep all numbers coherent with the new dish and portion.";

const DESCRIBE_PROMPT =
  "You are an expert Mozambican Nutritionist AI and core engine of 'Nutrifitness AI'. The user describes in free text (any language, maybe dictated by voice, maybe with typos) what they ate, with or without quantities. Identify every food, assume a typical adult portion when quantities are missing, and estimate the totals for the WHOLE meal. Return strictly a clean JSON object: { \"food_name\": string, \"estimated_weight_grams\": number, \"calories\": number, \"carbs_g\": number, \"protein_g\": number, \"fats_g\": number, \"fiber_g\": number, \"sugar_g\": number, \"added_sugar_g\": number, \"saturated_fat_g\": number, \"trans_fat_g\": number, \"polyunsaturated_fat_g\": number, \"monounsaturated_fat_g\": number, \"cholesterol_mg\": number, \"sodium_mg\": number, \"calcium_mg\": number, \"iron_mg\": number, \"potassium_mg\": number, \"vitamin_a_iu\": number, \"vitamin_c_mg\": number, \"vitamin_d_iu\": number, \"health_analysis\": string, \"confidence\": number }. food_name is a short name of the meal (e.g. 'Xima com peixe'). confidence is 0 to 100. health_analysis is 2 to 4 short friendly sentences, without medical claims. If the text does not describe food, return calories 0 and food_name 'unknown'.";

const INSIGHT_PROMPT =
  'És o nutricionista do Nutrifitness AI. Com base nos números do utilizador, escreve em português de Moçambique um resumo curto (máx. 3 frases) e um conselho prático, tom amigável, sem diagnósticos médicos nem promessas. Responde só com o texto.';

const WATER_PROMPT =
  'You write push-notification texts for the Nutrifitness AI app reminding the user to drink water. Return strictly a JSON array of 6 different strings. Each one is a friendly, motivating sentence of at most 110 characters, tailored to the user goal, without medical claims. Do not include emojis or the user name.';

const TIP_PROMPT =
  "You are the fitness coach of 'Nutrifitness AI'. From the user profile, training place, level and today's numbers, write ONE short practical tip for today (max 2 sentences, at most 200 characters). For weight loss suggest cardio such as running or walking 2 to 3 km today and say it helps burn calories; for muscle gain suggest a specific strength focus and enough protein; for other goals suggest an easy active habit. Be friendly and specific, no medical claims, no diagnoses. Reply with the text only.";

const PLAN_PROMPT =
  "You are a certified personal trainer inside 'Nutrifitness AI'. Build ONE workout for the requested type, place (home = no or very little equipment, gym = machines and free weights, outdoor = park or street, studio = classes) and level, fitting the requested minutes and the user's goal. Return strictly a clean JSON object: { \"title\": string, \"minutes\": number, \"kcal\": number, \"warmup\": string[], \"exercises\": [ { \"name\": string, \"sets\": number, \"reps\": string, \"rest_sec\": number, \"tip\": string } ], \"cooldown\": string[], \"note\": string }. 5 to 8 exercises, safe for the level, short tips (max 90 characters), warmup and cooldown with 2 to 4 short items each, kcal is a rough estimate for the whole session. No medical claims.";

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  nl: 'Dutch',
  af: 'Afrikaans',
  zh: 'Simplified Chinese',
};
/** Perfil da pessoa (do quiz) para personalizar as respostas; nunca é repetido tal e qual ao utilizador. */
const personal = (ctx?: string) =>
  typeof ctx === 'string' && ctx.trim()
    ? ` Personalise tone, tips and health_analysis to this user profile (do not quote it literally, do not diagnose): ${ctx.trim().slice(0, 700)}.`
    : '';
const langName = (lang?: string) => (lang && LANG_NAMES[lang]) || 'Portuguese (Mozambique)';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });
}

async function gemini(parts: unknown[], asJson: boolean, system?: string): Promise<string> {
  const body = JSON.stringify({
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.2, ...(asJson ? { responseMimeType: 'application/json' } : {}) },
  });
  let lastStatus = 0;
  for (const model of MODELS) {
    const res = await fetch(geminiUrl(model), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body,
    });
    if (res.ok) {
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    }
    lastStatus = res.status;
    // 404 = modelo retirado/inexistente; 429/5xx = limite ou falha temporária: tenta o próximo.
    if (res.status !== 404 && res.status !== 429 && res.status < 500) break;
  }
  throw new Error(`gemini_${lastStatus}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!GEMINI_KEY) return json({ error: 'not_configured' }, 503);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: 'unauthorized' }, 401);

  let body: { action?: string; image?: string; stats?: unknown; analysis?: unknown; instruction?: string; lang?: string; goal?: string; context?: string; place?: string; level?: string; kind?: string; minutes?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  try {
    if (body.action === 'scan') {
      if (!body.image || body.image.length > 600_000) return json({ error: 'bad_image' }, 400);
      // O limite do plano é validado e consumido aqui, no servidor, antes de gastar a IA.
      const { data: access, error } = await supabase.rpc('consume_scan');
      if (error) return json({ error: 'access_error' }, 500);
      if (!access?.allowed) return json({ allowed: false, status: access }, 200);
      const text = await gemini(
        [{ inlineData: { mimeType: 'image/jpeg', data: body.image } }, { text: 'Analyze this meal. Reply with the JSON object only.' }],
        true,
        `${SCAN_PROMPT} Write food_name and health_analysis in ${langName(body.lang)}.${personal(body.context)}`,
      );
      return json({ allowed: true, status: access, text });
    }

    if (body.action === 'refine') {
      const instruction = typeof body.instruction === 'string' ? body.instruction.trim().slice(0, 300) : '';
      if (!instruction || typeof body.analysis !== 'object' || body.analysis === null) return json({ error: 'bad_request' }, 400);
      // A correção por texto também conta como uma análise do plano.
      const { data: access, error } = await supabase.rpc('consume_scan');
      if (error) return json({ error: 'access_error' }, 500);
      if (!access?.allowed) return json({ allowed: false, status: access }, 200);
      const text = await gemini(
        [{ text: JSON.stringify({ current: body.analysis, correction: instruction }) }],
        true,
        `${REFINE_PROMPT} Write food_name and health_analysis in ${langName(body.lang)}.${personal(body.context)}`,
      );
      return json({ allowed: true, status: access, text });
    }

    if (body.action === 'describe') {
      const description = typeof body.instruction === 'string' ? body.instruction.trim().slice(0, 400) : '';
      if (!description) return json({ error: 'bad_request' }, 400);
      // Descrever o prato também conta como uma análise do plano.
      const { data: access, error } = await supabase.rpc('consume_scan');
      if (error) return json({ error: 'access_error' }, 500);
      if (!access?.allowed) return json({ allowed: false, status: access }, 200);
      const text = await gemini(
        [{ text: description }],
        true,
        `${DESCRIBE_PROMPT} Write food_name and health_analysis in ${langName(body.lang)}.${personal(body.context)}`,
      );
      return json({ allowed: true, status: access, text });
    }

    if (body.action === 'insight') {
      const { data: access } = await supabase.rpc('get_access_status');
      if (!access?.is_premium) return json({ error: 'pro_only' }, 403);
      const text = await gemini([{ text: JSON.stringify(body.stats ?? {}).slice(0, 4000) }], false, `${INSIGHT_PROMPT} Reply in ${langName(body.lang)}.${personal(body.context)}`);
      return json({ text: text.trim() });
    }

    if (body.action === 'water') {
      const goal = typeof body.goal === 'string' ? body.goal.slice(0, 30) : 'generic';
      const text = await gemini([{ text: JSON.stringify({ goal }) }], true, `${WATER_PROMPT} Write in ${langName(body.lang)}.`);
      return json({ text });
    }

    if (body.action === 'workout_tip') {
      const info = { goal: body.goal ?? 'generic', place: body.place ?? 'home', level: body.level ?? 'beginner', stats: body.stats ?? {} };
      const text = await gemini([{ text: JSON.stringify(info).slice(0, 2000) }], false, `${TIP_PROMPT} Reply in ${langName(body.lang)}.${personal(body.context)}`);
      return json({ text: text.trim() });
    }

    if (body.action === 'workout_plan') {
      const { data: access } = await supabase.rpc('get_access_status');
      if (!access?.is_premium) return json({ error: 'pro_only' }, 403);
      const info = {
        type: String(body.kind ?? 'strength').slice(0, 30),
        place: String(body.place ?? 'home').slice(0, 20),
        level: String(body.level ?? 'beginner').slice(0, 20),
        minutes: Math.min(90, Math.max(10, Number(body.minutes) || 30)),
        goal: body.goal ?? 'generic',
      };
      const text = await gemini([{ text: JSON.stringify(info) }], true, `${PLAN_PROMPT} Write in ${langName(body.lang)}.${personal(body.context)}`);
      return json({ text });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch {
    return json({ error: 'ai_failed' }, 502);
  }
});
