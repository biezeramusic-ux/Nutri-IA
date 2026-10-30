import { getLang } from '../i18n';

const VOICE: Record<string, string> = { pt: 'pt-PT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', nl: 'nl-NL', af: 'af-ZA', zh: 'zh-CN' };

type SpeechModule = { speak: (text: string, opts?: Record<string, unknown>) => void; stop: () => void };
let speech: SpeechModule | null | undefined;

function load(): SpeechModule | null {
  if (speech !== undefined) return speech;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    speech = require('expo-speech') as SpeechModule;
  } catch {
    speech = null;
  }
  return speech;
}

/** Fala uma frase em voz alta no idioma da app (treinador de corrida). Falha em silêncio se o telemóvel não suportar. */
export function coachSpeak(text: string): void {
  try {
    const s = load();
    if (!s) return;
    s.stop();
    s.speak(text, { language: VOICE[getLang()] ?? 'pt-PT', rate: 0.95, pitch: 1.0 });
  } catch {
    // sem voz disponível
  }
}

export function coachStop(): void {
  try {
    load()?.stop();
  } catch {
    // ignora
  }
}
