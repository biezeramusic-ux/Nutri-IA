import type { AuthError } from '@supabase/supabase-js';

/** Traduz erros do Supabase Auth para mensagens claras em português. */
export function translateAuthError(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Este e-mail já está registado. Tente iniciar sessão.';
    case 'email_not_confirmed':
      return 'Confirme o seu e-mail antes de entrar (verifique a caixa de entrada).';
    case 'weak_password':
      return 'Senha demasiado fraca. Use pelo menos 6 caracteres.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Demasiadas tentativas. Aguarde um momento e tente novamente.';
    case 'signup_disabled':
      return 'Os registos estão temporariamente desativados.';
    default:
      break;
  }
  if (error.name === 'AuthRetryableFetchError' || /network|fetch/i.test(error.message)) {
    return 'Sem ligação à internet. Verifique a rede e tente novamente.';
  }
  return 'Não foi possível concluir. Tente novamente.';
}
