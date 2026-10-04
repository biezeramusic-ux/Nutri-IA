import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { FREE_SCANS_PER_DAY, PLANS, TRIAL_DAYS } from '../constants/plans';
import { STORAGE_KEYS, loadJSON, saveJSON, todayKey } from '../services/storage';
import type { PlanId, SubscriptionState } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

const INITIAL: SubscriptionState = {
  firstUseAt: null,
  scansByDay: {},
  plan: null,
  expiresAt: null,
};

export type LockReason = 'trial_expired' | 'daily_limit' | null;

interface SubscriptionContextValue {
  ready: boolean;
  isPremium: boolean;
  trialDaysLeft: number;
  scansToday: number;
  scansLeftToday: number;
  /** Motivo do bloqueio das funções gratuitas, ou null se estiver liberado. */
  lockReason: LockReason;
  canScan: boolean;
  registerScan: () => void;
  activatePlan: (plan: PlanId) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(INITIAL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await loadJSON<SubscriptionState>(STORAGE_KEYS.subscription, INITIAL);
      // Primeiro uso: inicia o período de teste gratuito.
      const next = stored.firstUseAt ? stored : { ...stored, firstUseAt: Date.now() };
      setState(next);
      if (!stored.firstUseAt) await saveJSON(STORAGE_KEYS.subscription, next);
      setReady(true);
    })();
  }, []);

  const persist = useCallback((updater: (s: SubscriptionState) => SubscriptionState) => {
    setState((prev) => {
      const next = updater(prev);
      void saveJSON(STORAGE_KEYS.subscription, next);
      return next;
    });
  }, []);

  const registerScan = useCallback(() => {
    const key = todayKey();
    persist((s) => ({ ...s, scansByDay: { ...s.scansByDay, [key]: (s.scansByDay[key] ?? 0) + 1 } }));
  }, [persist]);

  const activatePlan = useCallback(
    (planId: PlanId) => {
      const plan = PLANS.find((p) => p.id === planId);
      if (!plan) return;
      persist((s) => {
        // Renovar antes de expirar acumula o tempo restante.
        const base = s.expiresAt && s.expiresAt > Date.now() ? s.expiresAt : Date.now();
        return { ...s, plan: planId, expiresAt: base + plan.days * DAY_MS };
      });
    },
    [persist],
  );

  const value = useMemo<SubscriptionContextValue>(() => {
    const now = Date.now();
    const isPremium = !!state.expiresAt && state.expiresAt > now;
    const elapsedDays = state.firstUseAt ? Math.floor((now - state.firstUseAt) / DAY_MS) : 0;
    const trialDaysLeft = Math.max(0, TRIAL_DAYS - elapsedDays);
    const scansToday = state.scansByDay[todayKey()] ?? 0;
    const scansLeftToday = Math.max(0, FREE_SCANS_PER_DAY - scansToday);

    let lockReason: LockReason = null;
    if (!isPremium) {
      if (trialDaysLeft === 0) lockReason = 'trial_expired';
      else if (scansLeftToday === 0) lockReason = 'daily_limit';
    }

    return {
      ready,
      isPremium,
      trialDaysLeft,
      scansToday,
      scansLeftToday,
      lockReason,
      canScan: lockReason === null,
      registerScan,
      activatePlan,
    };
  }, [state, ready, registerScan, activatePlan]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription deve ser usado dentro de <SubscriptionProvider>');
  return ctx;
}
