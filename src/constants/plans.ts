import type { Plan } from '../types';

export const TRIAL_DAYS = 3;
export const FREE_SCANS_PER_DAY = 2;

export const PLANS: Plan[] = [
  { id: 'weekly', label: 'Semanal', priceMT: 50, days: 7, period: '/ semana' },
  { id: 'monthly', label: 'Mensal', priceMT: 187, days: 30, period: '/ mês', badge: 'Mais Escolhido' },
  { id: 'yearly', label: 'Anual', priceMT: 1800, days: 365, period: '/ ano', badge: 'Melhor Valor' },
];
