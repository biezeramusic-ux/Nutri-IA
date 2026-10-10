/** Sistema de design do Nutri IA: neutros slate + Verde Saúde, pensado para ecrãs de telemóvel. */
export const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  surface: '#F1F5F9',
  primary: '#4CAF50',
  primaryDark: '#2E7D32',
  primarySoft: '#ECF7ED',
  lime: '#FBBF24',
  limeSoft: '#FFF7E0',
  limeDark: '#B45309',
  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  border: '#E2E8F0',
  carbs: '#F5A524',
  protein: '#4C9AFF',
  fats: '#F472B6',
  water: '#38BDF8',
  waterSoft: '#E0F2FE',
  mpesa: '#E60000',
  emola: '#F57C00',
  navy: '#0B1F3A',
  navySoft: '#16335C',
  hero: '#0B1F3A',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
}

export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const darkColors: ThemeColors = {
  background: '#0B1120',
  card: '#131C2E',
  surface: '#1B2538',
  primary: '#4CAF50',
  primaryDark: '#7BD87F',
  primarySoft: '#16301B',
  lime: '#FBBF24',
  limeSoft: '#2B2412',
  limeDark: '#FCD34D',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  border: '#243049',
  carbs: '#F5A524',
  protein: '#4C9AFF',
  fats: '#F472B6',
  water: '#38BDF8',
  waterSoft: '#0C2A3D',
  mpesa: '#E60000',
  emola: '#F57C00',
  navy: '#0B1F3A',
  navySoft: '#16335C',
  hero: '#0B1F3A',
  danger: '#F87171',
  dangerSoft: '#3A1517',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  card: 20,
  pill: 999,
} as const;

/** Escala tipográfica (px). Títulos fortes, texto de apoio mais pequeno e com menos contraste. */
export const font = {
  display: 30,
  h1: 24,
  h2: 18,
  h3: 15,
  body: 14,
  small: 12,
  tiny: 11,
} as const;

/** Espaçamentos (px): generosos, mas dimensionados para telemóvel. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Sombra suave (shadow-sm). */
export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
} as const;

/** Cartão base: fundo do tema, borda fina e sombra leve. */
export const cardBase = (c: ThemeColors) =>
  ({
    backgroundColor: c.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: c.border,
    ...shadow,
  }) as const;

/** Espaço reservado no fim dos ecrãs para a barra de abas flutuante. */
export const TAB_BAR_SPACE = 104;

export const SCREEN_PADDING = 20;

export const petalPalette = [
  '#4CAF50',
  '#F5A524',
  '#4C9AFF',
  '#F472B6',
  '#A78BFA',
  '#2DD4BF',
  '#FB923C',
  '#A8A29E',
] as const;

/** Formata valores em MT com ponto nos milhares (1.999). */
export const formatMT = (value: number): string => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Cor de destaque escolhida pelo utilizador (botões, separadores, realces). */
export type AccentId = 'green' | 'blue' | 'purple' | 'orange' | 'pink' | 'black';

interface AccentSet {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  hero: string;
}

export const ACCENTS: { id: AccentId; label: string; swatch: string; light: AccentSet; dark: AccentSet }[] = [
  {
    id: 'green',
    label: 'Verde',
    swatch: '#4CAF50',
    light: { primary: '#4CAF50', primaryDark: '#2E7D32', primarySoft: '#ECF7ED', hero: '#0B1F3A' },
    dark: { primary: '#4CAF50', primaryDark: '#7BD87F', primarySoft: '#16301B', hero: '#0B1F3A' },
  },
  {
    id: 'blue',
    label: 'Azul',
    swatch: '#3B82F6',
    light: { primary: '#3B82F6', primaryDark: '#1D4ED8', primarySoft: '#E8F0FE', hero: '#0F2A5C' },
    dark: { primary: '#3B82F6', primaryDark: '#93C5FD', primarySoft: '#142544', hero: '#0F2A5C' },
  },
  {
    id: 'purple',
    label: 'Roxo',
    swatch: '#8B5CF6',
    light: { primary: '#8B5CF6', primaryDark: '#6D28D9', primarySoft: '#F1EBFE', hero: '#2E1065' },
    dark: { primary: '#8B5CF6', primaryDark: '#C4B5FD', primarySoft: '#271B4A', hero: '#2E1065' },
  },
  {
    id: 'orange',
    label: 'Laranja',
    swatch: '#F97316',
    light: { primary: '#F97316', primaryDark: '#C2410C', primarySoft: '#FFF1E6', hero: '#431407' },
    dark: { primary: '#F97316', primaryDark: '#FDBA74', primarySoft: '#3A2210', hero: '#431407' },
  },
  {
    id: 'pink',
    label: 'Rosa',
    swatch: '#EC4899',
    light: { primary: '#EC4899', primaryDark: '#BE185D', primarySoft: '#FDEAF3', hero: '#500724' },
    dark: { primary: '#EC4899', primaryDark: '#F9A8D4', primarySoft: '#3D1730', hero: '#500724' },
  },
  {
    id: 'black',
    label: 'Preto',
    swatch: '#111827',
    light: { primary: '#111827', primaryDark: '#111827', primarySoft: '#F1F5F9', hero: '#0A0A0A' },
    // No tema escuro o "preto" não se vê: usa cinzento grafite.
    dark: { primary: '#4B5563', primaryDark: '#E5E7EB', primarySoft: '#1F2937', hero: '#0A0A0A' },
  },
];

export function applyAccent(base: ThemeColors, accent: AccentId, isDark: boolean): ThemeColors {
  const entry = ACCENTS.find((a) => a.id === accent) ?? ACCENTS[0];
  return { ...base, ...(isDark ? entry.dark : entry.light) };
}
