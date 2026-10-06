import type { PlanId } from '../../types';
import type { AccessStatus, LockReason } from '../../types';
import type { Json } from '../database.types';
import { supabase } from '../supabase';

export interface ConsumeScanResult extends AccessStatus {
  allowed: boolean;
}

function parseLockReason(value: unknown): LockReason {
  return value === 'trial_expired' || value === 'daily_limit' ? value : null;
}

function parseStatus(json: Json): ConsumeScanResult {
  const o = (typeof json === 'object' && json !== null && !Array.isArray(json) ? json : {}) as Record<
    string,
    Json | undefined
  >;
  return {
    allowed: o.allowed === true,
    isPremium: o.is_premium === true,
    trialDaysLeft: typeof o.trial_days_left === 'number' ? o.trial_days_left : 0,
    scansLeftToday: typeof o.scans_left_today === 'number' ? o.scans_left_today : null,
    mealsLeft: typeof o.meals_left === 'number' ? o.meals_left : null,
    lockReason: parseLockReason(o.lock_reason),
  };
}

function stripAllowed({ allowed: _allowed, ...status }: ConsumeScanResult): AccessStatus {
  return status;
}

/** Estado de acesso (teste grátis / limite diário / premium) vindo do perfil na nuvem. */
export async function getAccessStatus(): Promise<AccessStatus> {
  const { data, error } = await supabase.rpc('get_access_status');
  if (error) throw new Error(error.message);
  return stripAllowed(parseStatus(data));
}

/** Consome um scan de forma atómica no servidor. Deve ser chamada antes da IA. */
export async function consumeScan(): Promise<ConsumeScanResult> {
  const { data, error } = await supabase.rpc('consume_scan');
  if (error) throw new Error(error.message);
  return parseStatus(data);
}

/** Ativa um plano (simulado em DEV; em produção é feito por webhook de pagamento). */
export async function activatePlan(plan: PlanId): Promise<AccessStatus> {
  const { data, error } = await supabase.rpc('activate_plan', { p_plan: plan });
  if (error) {
    if (error.message.includes('dev_activation_disabled')) {
      throw new Error(
        'Ativação simulada desligada no servidor. Em desenvolvimento execute: alter database postgres set app.allow_dev_activation = \'true\';',
      );
    }
    throw new Error(error.message);
  }
  return stripAllowed(parseStatus(data));
}
