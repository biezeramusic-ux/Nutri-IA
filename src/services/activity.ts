/** Tipos de atividade e gasto energético estimado (MET × peso × horas). */
export const ACTIVITY_TYPES: { id: string; label: string; met: number }[] = [
  { id: 'walk', label: 'Caminhada', met: 3.5 },
  { id: 'run', label: 'Corrida', met: 9 },
  { id: 'bike', label: 'Ciclismo', met: 7 },
  { id: 'football', label: 'Futebol', met: 8 },
  { id: 'dance', label: 'Dança', met: 5 },
  { id: 'gym', label: 'Ginásio', met: 5 },
  { id: 'swim', label: 'Natação', met: 7 },
  { id: 'other', label: 'Outra', met: 4 },
];

export const STEPS_GOAL = 8000;

export function estimateKcal(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * weightKg * (minutes / 60));
}
