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
    title: '🌅 Bom dia!',
    bodies: [
      'Comece o seu dia certo: fotografe o pequeno-almoço e veja as calorias em segundos.',
      '{name}, o que há para o pequeno-almoço? Tire uma foto e registe agora. ☕',
      'Um bom começo faz o dia todo. Registe o seu pequeno-almoço com o scanner.',
      'Já tomou o pequeno-almoço? Um toque no scanner e fica registado. 🥐',
    ],
  },
  {
    type: 'lunch',
    hour: 12,
    minute: 30,
    title: '🍽️ Hora do almoço',
    bodies: [
      'Bom apetite! Fotografe o seu prato antes de comer e descubra as calorias.',
      '{name}, o almoço está servido? Escaneie o prato e acompanhe a sua meta de hoje. 🍲',
      'Não adivinhe as calorias: aponte a câmara ao prato e o Nutri IA faz as contas.',
      'Pausa para o almoço! Registe o prato em 3 segundos.',
    ],
  },
  {
    type: 'snack',
    hour: 16,
    minute: 0,
    title: '🍎 Hora do lanche',
    bodies: [
      'Um lanche saudável mantém a energia lá em cima. Se comer algo, escaneie! 🍌',
      '{name}, beliscou alguma coisa? Registe o lanche para o dia ficar completo.',
      'Fome a meio da tarde? Escolha bem e registe o lanche com uma foto.',
    ],
  },
  {
    type: 'dinner',
    hour: 19,
    minute: 30,
    title: '🌙 Hora do jantar',
    bodies: [
      'Está na hora do jantar! Escaneie o prato e feche o dia com tudo registado.',
      '{name}, falta o jantar para completar o seu dia. Tire uma foto agora. 🍛',
      'Último registo do dia: fotografe o jantar e veja como correu a sua meta.',
      'Bom jantar! Não se esqueça de escanear o prato antes de começar. 🌟',
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
      // Sem nome, tira o "{name}, " do início e põe a primeira letra maiúscula.
      const body = firstName
        ? tr(raw).replace('{name}', firstName)
        : tr(raw).replace(/\{name\},?\s*/, '').replace(/^./, (c) => c.toUpperCase());
      result.push({ at, title: tr(slot.title), body });
    });
  }
  return result;
}
