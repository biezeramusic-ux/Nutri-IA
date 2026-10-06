import type { Plan } from '../types';

/** Limites do plano FREE (têm de coincidir com supabase/migrations/004_free_pro_limits.sql). */
export const TRIAL_DAYS = 3;
export const FREE_SCANS_PER_DAY = 2;
/** Registos de refeição no TOTAL durante o teste grátis (não por dia). */
export const FREE_MEALS_TOTAL = 5;

/** Todos os planos PRO têm os mesmos recursos; só muda o período. */
export const PLANS: Plan[] = [
  { id: 'weekly', label: 'Semanal', priceMT: 50, days: 7, period: '/ semana' },
  { id: 'monthly', label: 'Mensal', priceMT: 189, days: 30, period: '/ mês', badge: 'Mais Escolhido' },
  { id: 'yearly', label: 'Anual', priceMT: 1999, days: 365, period: '/ ano', badge: 'Melhor Valor' },
];

export const FREE_FEATURES: string[] = [
  '2 análises de refeições',
  'Até 5 registos de refeições',
  'Calorias',
  'Proteínas',
  'Carboidratos',
  'Gorduras',
  'Resumo nutricional básico',
  'Diário alimentar',
  'Definição de objetivo',
  'Acesso durante 3 dias',
];

export const PRO_FEATURES: string[] = [
  'Análises de refeições ilimitadas',
  'Fotos de refeições ilimitadas',
  'Registo de refeições ilimitado',
  'Calorias',
  'Proteínas',
  'Carboidratos',
  'Gorduras',
  'Fibras',
  'Análise nutricional detalhada',
  'Diário alimentar completo',
  'Acompanhamento do progresso',
  'Objetivos personalizados',
  'Registo de água',
  'Registo de atividade física',
  'Reconhecimento de pratos e alimentos moçambicanos',
  'Histórico completo das refeições',
];
