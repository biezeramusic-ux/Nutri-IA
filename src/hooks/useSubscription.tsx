import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
  lockReason: null,
};

interface SubscriptionContextValue extends AccessStatus {
  loading: boolean;
  canScan: boolean;
  refresh: () => Promise<void>;
  /** Consome um scan no servidor (atómico). Chamar antes da IA. Lança erro se offline. */
  consumeScan: () => Promise<ConsumeScanResult>;
  activatePlan: (plan: PlanId) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

/** Estado do teste grátis / limite diário / premium, guardado no perfil na nuvem. */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [status, setStatus] = useState<AccessStatus>(INITIAL);
  const [loading, setLoading] = useState(false);

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

  const activatePlan = useCallback(async (plan: PlanId) => {
    setStatus(await activatePlanRemote(plan));
  }, []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({ ...status, loading, canScan: status.lockReason === null, refresh, consumeScan, activatePlan }),
    [status, loading, refresh, consumeScan, activatePlan],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription deve ser usado dentro de <SubscriptionProvider>');
  return ctx;
}
