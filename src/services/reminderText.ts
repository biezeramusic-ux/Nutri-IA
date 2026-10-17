/** Nome da pessoa usado nas notificações. Atualizado pela app (RemindersSync) sempre que o nome muda. */
let reminderName: string | undefined;

export const setReminderName = (name?: string): void => {
  reminderName = name?.trim() || undefined;
};

export const getReminderName = (): string | undefined => reminderName;

/**
 * Põe o nome na frase ("{name}"). Sem nome, tira o "{name}" e a vírgula à volta,
 * e a frase continua a fazer sentido ("Ana, hora do almoço!" → "Hora do almoço!").
 */
export function personalize(text: string, name?: string): string {
  const n = (name ?? reminderName)?.trim();
  if (n) return text.replace(/\{name\}/g, n);
  const cleaned = text
    .replace(/\{name\}\s*[,，]\s*/g, '')
    .replace(/\s*[,，]\s*\{name\}/g, '')
    .replace(/\{name\}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
