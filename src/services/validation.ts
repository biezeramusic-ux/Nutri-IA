const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
import { tr } from '../i18n';

export const MIN_PASSWORD_LENGTH = 6;

export function validateName(value: string): string | null {
  return value.trim().length >= 2 ? null : tr('Indique o seu nome.');
}

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return tr('Indique o seu e-mail.');
  return EMAIL_RE.test(email) ? null : tr('E-mail inválido.');
}

export function validatePassword(value: string): string | null {
  if (!value) return tr('Indique a sua senha.');
  return value.length >= MIN_PASSWORD_LENGTH
    ? null
    : tr('A senha deve ter pelo menos {n} caracteres.', { n: MIN_PASSWORD_LENGTH });
}
