import { tr } from '../i18n';
import type { GoalType, Habits } from '../types';

const BY_GOAL: Record<GoalType, string> = {
  lose_weight: 'Beber água antes das refeições ajuda a controlar a fome e a perder peso.',
  maintain: 'Manter-se hidratado ajuda a manter o peso e a energia ao longo do dia.',
  gain_muscle: 'A água ajuda na recuperação e no crescimento dos músculos.',
  eat_healthy: 'A água é a melhor bebida para uma alimentação equilibrada.',
  track_calories: 'A água não tem calorias e ajuda a sentir-se saciado entre refeições.',
};

/** Texto do cartão "Ative os lembretes de água", adaptado ao que a pessoa respondeu no quiz. */
export function reminderPitch(goal: GoalType | null, habits: Habits | null, waterMl: number): string {
  let lead = tr(goal ? BY_GOAL[goal] : 'Beber água ao longo do dia faz bem ao corpo e à concentração.');
  if (habits?.sugaryDrinks) lead = tr('Trocar refrigerantes e sumos açucarados por água faz uma grande diferença.');
  else if (habits && !habits.drinksEnoughWater) lead = tr('Vimos que bebe pouca água. Pequenos lembretes ajudam a criar o hábito.');
  const liters = (waterMl / 1000).toFixed(1).replace('.', ',');
  return `${lead} ${tr('A sua meta é {liters} L por dia e o Nutri IA avisa-o nas horas certas.', { liters })}`;
}
