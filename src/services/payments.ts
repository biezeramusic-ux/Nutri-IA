import type { Plan } from '../types';

/**
 * ⚠️ STUBS SIMULADOS: nenhuma cobrança real é feita.
 * Substituir pelas integrações reais (M-Pesa/Vodacom, e-Mola/Movitel, gateway de cartões)
 * quando houver backend e credenciais de comerciante.
 */
export interface PaymentResult {
  success: boolean;
  reference?: string;
  error?: string;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function reference(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^258/, '');
}

export async function payWithMpesa(plan: Plan, phone: string): Promise<PaymentResult> {
  const number = normalizePhone(phone);
  if (!/^8[45]\d{7}$/.test(number)) {
    return { success: false, error: 'Número M-Pesa inválido (84 ou 85 + 7 dígitos).' };
  }
  await wait(1500);
  return { success: true, reference: reference('MPESA') };
}

export async function payWithEmola(plan: Plan, phone: string): Promise<PaymentResult> {
  const number = normalizePhone(phone);
  if (!/^8[67]\d{7}$/.test(number)) {
    return { success: false, error: 'Número e-Mola inválido (86 ou 87 + 7 dígitos).' };
  }
  await wait(1500);
  return { success: true, reference: reference('EMOLA') };
}

export async function payWithCard(plan: Plan): Promise<PaymentResult> {
  await wait(1500);
  return { success: true, reference: reference('CARD') };
}
