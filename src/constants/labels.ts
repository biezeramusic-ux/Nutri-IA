import type { ActivityLevel, GoalType } from '../types';

export const GOAL_LABEL: Record<GoalType, string> = {
  lose_weight: 'Perder peso',
  maintain: 'Manter o peso',
  gain_muscle: 'Ganhar massa muscular',
  eat_healthy: 'Comer mais saudável',
  track_calories: 'Saber as calorias dos meus pratos',
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: 'Sedentário',
  light: 'Leve',
  moderate: 'Moderado',
  very_active: 'Muito ativo',
};
