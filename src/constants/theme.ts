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
  background: '#000000',
  card: '#111111',
  surface: '#1A1A1A',
  primary: '#4CAF50',
  primaryDark: '#7BD87F',
  primarySoft: '#14231A',
  lime: '#FBBF24',
  limeSoft: '#241E0E',
  limeDark: '#FCD34D',
  text: '#FAFAFA',
  textMuted: '#A3A3A3',
  textFaint: '#6B6B6B',
  border: '#262626',
  carbs: '#F5A524',
  protein: '#4C9AFF',
  fats: '#F472B6',
  water: '#38BDF8',
  waterSoft: '#0A2230',
  mpesa: '#E60000',
  emola: '#F57C00',
  navy: '#0B1F3A',
  navySoft: '#16335C',
  hero: '#111111',
  danger: '#F87171',
  dangerSoft: '#2A1213',
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
