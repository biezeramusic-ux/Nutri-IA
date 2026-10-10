import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { TRIAL_DAYS } from '../constants/plans';
import {
  activatePlan as activatePlanRemote,
  consumeScan as consumeScanRemote,
  getAccessStatus,
  type ConsumeScanResult,
} from '../services/repositories/access';
import type { AccessStatus, LockReason, PlanId } from '../types';
import { useAuth } from './useAuth';

export type { LockReason };

const INITIAL: AccessStatus = {
  isPremium: false,
  trialDaysLeft: TRIAL_DAYS,
  scansLeftToday: null,
  mealsLeft: null,
  lockReason: null,
};

interface SubscriptionContextValue extends AccessStatus {
  loading: boolean;
  /** true no plano PRO (todos os recursos). O teste FREE tem recursos limitados. */
  isPro: boolean;
  canScan: boolean;
  refresh: () => Promise<void>;
  /** Consome um scan no servidor (atómico). Chamar antes da IA. Lança erro se offline. */
  consumeScan: () => Promise<ConsumeScanResult>;
  activatePlan: (plan: PlanId, paidMT?: number) => Promise<void>;
  /** Último plano pago neste aparelho (para mostrar o preço activo). */
  activePlan: { planId: PlanId; priceMT: number } | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

/** Estado do teste grátis / limite diário / premium, guardado no perfil na nuvem. */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [status, setStatus] = useState<AccessStatus>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<{ planId: PlanId; priceMT: number } | null>(null);
  const planKey = userId ? `nutria.activePlan.${userId}` : null;

  useEffect(() => {
    setActivePlan(null);
    if (!planKey) return;
    AsyncStorage.getItem(planKey)
      .then((raw) => raw && setActivePlan(JSON.parse(raw)))
      .catch(() => {});
  }, [planKey]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setStatus(await getAccessStatus());
    } catch {
      // Sem rede: mantém o último estado conhecido. O servidor valida em consumeScan().
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setStatus(INITIAL);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
    // Reavalia ao voltar à app (ex.: virou o dia em Maputo).
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => sub.remove();
  }, [userId, refresh]);

  const consumeScan = useCallback(async () => {
    const { allowed, ...next } = await consumeScanRemote();
    setStatus(next);
    return { allowed, ...next };
  }, []);

  const activatePlan = useCallback(
    async (plan: PlanId, paidMT?: number) => {
      setStatus(await activatePlanRemote(plan));
      if (paidMT != null) {
        const next = { planId: plan, priceMT: paidMT };
        setActivePlan(next);
        if (planKey) AsyncStorage.setItem(planKey, JSON.stringify(next)).catch(() => {});
      }
    },
    [planKey],
  );

  const value = useMemo<SubscriptionContextValue>(
    () => ({ ...status, loading, isPro: status.isPremium, canScan: status.lockReason === null, refresh, consumeScan, activatePlan, activePlan }),
    [status, loading, refresh, consumeScan, activatePlan, activePlan],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription deve ser usado dentro de <SubscriptionProvider>');
  return ctx;
}
