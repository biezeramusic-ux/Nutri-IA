import type { MealType } from '../types';
import { tr } from '../i18n';

export interface PlannedMealReminder {
  at: Date;
  title: string;
  body: string;
}

interface Slot {
  type: MealType;
  hour: number;
  minute: number;
  title: string;
  /** Várias mensagens: rodam de dia para dia para não cansar. {name} = primeiro nome. */
  bodies: string[];
}

const SLOTS: Slot[] = [
  {
    type: 'breakfast',
    hour: 8,
    minute: 0,
    title: 'Bom dia, {name}! ☀️',
    bodies: [
      'Comece o dia com carinho para o seu corpo. Fotografe o seu pequeno-almoço! 🥐',
      'O café da manhã está pronto? Um toque no scanner e fica registado. ☕',
      'Que o seu dia comece doce e saudável. Registe o pequeno-almoço! 🍓',
      'Um bom dia começa com um bom pequeno-almoço. Mostre-nos o seu prato! 🥣',
    ],
  },
  {
    type: 'lunch',
    hour: 12,
    minute: 30,
    title: 'Hora do almoço, {name} 🍽️',
    bodies: [
      'Bom apetite! Mostre-nos o seu prato e descubra as calorias. 🍲',
      'Pausa merecida! Escaneie o almoço antes de começar a comer. 😋',
      'O seu corpo agradece um almoço bem registado. Tire uma foto! 📸',
      'Que bom cheiro! Fotografe o prato e deixe o resto connosco. 🌿',
    ],
  },
  {
    type: 'snack',
    hour: 16,
    minute: 0,
    title: 'Hora do lanche 🍎',
    bodies: [
      'Um lanchinho saudável faz bem à alma. Se comer algo, escaneie! 🍌',
      'Beliscou alguma coisa? Conte-nos, é rápido e simples. 🥜',
      'Uma pausa doce para si. Registe o seu lanche com uma foto. 🍊',
    ],
  },
  {
    type: 'dinner',
    hour: 19,
    minute: 30,
    title: 'Boa noite, {name}! 🌙',
    bodies: [
      'Está na hora do jantar. Escaneie o prato e termine o dia com tudo registado. 🍛',
      'Quase a fechar o dia! Fotografe o jantar e descanse tranquilo. ✨',
      'Um jantar leve, um sono tranquilo. Registe o seu prato. 🌟',
      'Bom jantar! Não se esqueça de escanear o prato antes de começar. 🍽️',
    ],
  },
];

const DAYS_AHEAD = 4;

interface Input {
  now: Date;
  firstName?: string;
  /** Refeições de hoje que já têm registo: não lembramos o que já foi feito. */
  loggedToday: MealType[];
  days?: number;
}

/** Planeia os lembretes de refeição dos próximos dias, com mensagens a rodar. */
export function planMealReminders({ now, firstName, loggedToday, days = DAYS_AHEAD }: Input): PlannedMealReminder[] {
  const result: PlannedMealReminder[] = [];
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  for (let d = 0; d < days; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    SLOTS.forEach((slot, s) => {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.hour, slot.minute, 0, 0);
      if (at.getTime() <= now.getTime() + 60_000) return;
      if (d === 0 && loggedToday.includes(slot.type)) return;
      const raw = slot.bodies[(dayOfYear + d + s) % slot.bodies.length];
      // Com nome: "Bom dia, Ana!"; sem nome: "Bom dia!".
      const fill = (text: string) => (firstName ? tr(text).replace('{name}', firstName) : tr(text).replace(/,?\s*\{name\}/g, ''));
      const body = fill(raw);
      result.push({ at, title: fill(slot.title), body });
    });
  }
  return result;
}
