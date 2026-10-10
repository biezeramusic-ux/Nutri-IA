import type { Json } from '../database.types';
import { supabase } from '../supabase';

export interface ReferralInfo {
  code: string;
  invited: number;
  needed: number;
  discountPct: number;
}

const asObject = (json: Json): Record<string, Json | undefined> =>
  typeof json === 'object' && json !== null && !Array.isArray(json) ? json : {};

export async function getReferralInfo(): Promise<ReferralInfo> {
  const { data, error } = await supabase.rpc('get_referral_info');
  if (error) throw new Error(error.message);
  const o = asObject(data);
  return {
    code: typeof o.code === 'string' ? o.code : '',
    invited: typeof o.invited === 'number' ? o.invited : 0,
    needed: typeof o.needed === 'number' ? o.needed : 10,
    discountPct: typeof o.discount_pct === 'number' ? o.discount_pct : 0,
  };
}

export type RedeemError = 'invalid_code' | 'own_code' | 'already_redeemed' | 'too_late' | 'unknown';

export async function redeemReferral(code: string): Promise<{ ok: true } | { ok: false; error: RedeemError }> {
  const { data, error } = await supabase.rpc('redeem_referral', { p_code: code });
  if (error) throw new Error(error.message);
  const o = asObject(data);
  if (o.ok === true) return { ok: true };
  const e = o.error;
  const known: RedeemError[] = ['invalid_code', 'own_code', 'already_redeemed', 'too_late'];
  return { ok: false, error: known.find((k) => k === e) ?? 'unknown' };
}

export const REDEEM_MESSAGES: Record<RedeemError, string> = {
  invalid_code: 'Código inválido. Confirme as letras e números.',
  own_code: 'Não pode usar o seu próprio código.',
  already_redeemed: 'Já usou um código de convite.',
  too_late: 'O código só pode ser usado nos primeiros 7 dias da conta.',
  unknown: 'Não foi possível usar o código.',
};
