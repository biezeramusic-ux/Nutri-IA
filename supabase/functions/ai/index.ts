// Edge Function "ai": reconhecimento de pratos (scanner) e resumo de progresso, via Gemini.
// A chave GEMINI_API_KEY fica só no Supabase (Secrets) — nunca na app.
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCAN_PROMPT =
  "You are an expert Mozambican Nutritionist AI and core engine of 'Nutri IA'. Analyze the food image. You must accurately recognize typical Mozambican culinary dishes (e.g., matapa, xima, mucapata, caril de amendoim, cacana, badgias, peixe grelhado, etc.) and estimate the weight in grams. Return strictly a clean JSON object: { \"food_name\": string, \"estimated_weight_grams\": number, \"calories\": number, \"carbs_g\": number, \"protein_g\": number, \"fats_g\": number, \"fiber_g\": number, \"confidence\": number }. Write food_name in Portuguese (Mozambique). confidence is 0 to 100.";

const INSIGHT_PROMPT =
  'És o nutricionista do Nutri IA. Com base nos números do utilizador, escreve em português de Moçambique um resumo curto (máx. 3 frases) e um conselho prático, tom amigável, sem diagnósticos médicos nem promessas. Responde só com o texto.';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });
}

async function gemini(parts: unknown[], asJson: boolean, system?: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, ...(asJson ? { responseMimeType: 'application/json' } : {}) },
    }),
  });
  if (!res.ok) throw new Error(`gemini_${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!GEMINI_KEY) return json({ error: 'not_configured' }, 503);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: 'unauthorized' }, 401);

  let body: { action?: string; image?: string; stats?: unknown };
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
        SCAN_PROMPT,
      );
      return json({ allowed: true, status: access, text });
    }

    if (body.action === 'insight') {
      const { data: access } = await supabase.rpc('get_access_status');
      if (!access?.is_premium) return json({ error: 'pro_only' }, 403);
      const text = await gemini([{ text: JSON.stringify(body.stats ?? {}).slice(0, 4000) }], false, INSIGHT_PROMPT);
      return json({ text: text.trim() });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch {
    return json({ error: 'ai_failed' }, 502);
  }
});
