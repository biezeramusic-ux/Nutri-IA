import { af } from './af';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { nl } from './nl';
import { zh } from './zh';

export type Lang = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'nl' | 'af' | 'zh';

export const LANGUAGES: { id: Lang; flag: string; name: string; hint: string }[] = [
  { id: 'pt', flag: '🇲🇿', name: 'Português', hint: 'Moçambique' },
  { id: 'en', flag: '🇬🇧', name: 'English', hint: 'International' },
  { id: 'es', flag: '🇪🇸', name: 'Español', hint: 'España · Latinoamérica' },
  { id: 'fr', flag: '🇫🇷', name: 'Français', hint: 'France · Afrique' },
  { id: 'de', flag: '🇩🇪', name: 'Deutsch', hint: 'Deutschland' },
  { id: 'it', flag: '🇮🇹', name: 'Italiano', hint: 'Italia' },
  { id: 'nl', flag: '🇳🇱', name: 'Nederlands', hint: 'Nederland' },
  { id: 'af', flag: '🇿🇦', name: 'Afrikaans', hint: 'Suid-Afrika' },
  { id: 'zh', flag: '🇨🇳', name: '中文', hint: '简体中文' },
];

export const isLang = (value: unknown): value is Lang => LANGUAGES.some((l) => l.id === value);

const dictionaries: Record<Lang, Record<string, string>> = { pt: {}, en, es, fr, de, it, nl, af, zh };

let current: Lang = 'pt';

export const getLang = (): Lang => current;
export const setCurrentLang = (lang: Lang): void => {
  current = lang;
};

/** Idioma inicial: o do telemóvel se a app o tiver, senão português. */
export function detectDeviceLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    const code = locale.split(/[-_]/)[0];
    return isLang(code) ? code : 'pt';
  } catch {
    return 'pt';
  }
}

/**
 * Traduz um texto. A chave é o próprio texto em português; se não houver tradução devolve o português.
 * Variáveis: tr('Faltam {n} dias', { n: 3 }).
 */
export function tr(text: string, vars?: Record<string, string | number>): string {
  const translated = dictionaries[current][text] ?? text;
  if (!vars) return translated;
  return translated.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}
