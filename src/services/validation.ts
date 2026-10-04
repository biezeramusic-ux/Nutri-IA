const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD_LENGTH = 6;

export function validateName(value: string): string | null {
  return value.trim().length >= 2 ? null : 'Indique o seu nome.';
}

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Indique o seu e-mail.';
  return EMAIL_RE.test(email) ? null : 'E-mail inválido.';
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Indique a sua senha.';
  return value.length >= MIN_PASSWORD_LENGTH
    ? null
    : `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
}
