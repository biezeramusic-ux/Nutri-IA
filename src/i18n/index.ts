import { en } from './en';

export type Lang = 'pt' | 'en';

export const LANGUAGES: { id: Lang; flag: string; name: string; hint: string }[] = [
  { id: 'pt', flag: '🇲🇿', name: 'Português', hint: 'Moçambique' },
  { id: 'en', flag: '🇬🇧', name: 'English', hint: 'International' },
];

const dictionaries: Record<Lang, Record<string, string>> = { pt: {}, en };

let current: Lang = 'pt';

export const getLang = (): Lang => current;
export const setCurrentLang = (lang: Lang): void => {
  current = lang;
};

/** Idioma inicial: inglês se o telemóvel estiver em inglês, senão português. */
export function detectDeviceLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    return locale.startsWith('en') ? 'en' : 'pt';
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
