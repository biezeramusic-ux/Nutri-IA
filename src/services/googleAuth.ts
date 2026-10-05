import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Necessário para fechar a janela de login no web; inofensivo no mobile.
WebBrowser.maybeCompleteAuthSession();

/** Lê parâmetros do fragmento (#a=b) e da query (?a=b) de um URL de retorno OAuth. */
function parseAuthParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.split('?')[1] ?? '';
  for (const part of [query, hash]) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [key, value = ''] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  }
  return params;
}

/**
 * Login com Google via OAuth do Supabase (abre o navegador do sistema).
 * Devolve false se o utilizador cancelou; lança Error se algo falhou.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = Linking.createURL('/');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw new Error('Não foi possível iniciar o login com Google.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  const params = parseAuthParams(result.url);
  if (params.error || params.error_description) {
    throw new Error(params.error_description ?? 'O login com Google foi recusado.');
  }
  if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw new Error('Não foi possível concluir o login com Google.');
    return true;
  }
  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw new Error('Não foi possível concluir o login com Google.');
    return true;
  }
  throw new Error('Resposta inválida do login com Google.');
}
