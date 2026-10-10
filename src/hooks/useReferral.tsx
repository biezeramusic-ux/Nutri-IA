import { useCallback, useEffect, useState } from 'react';
import { getReferralInfo, type ReferralInfo } from '../services/repositories/referral';
import { useAuth } from './useAuth';

const EMPTY: ReferralInfo = { code: '', invited: 0, needed: 10, discountPct: 0 };

export function useReferral() {
  const { user } = useAuth();
  const [info, setInfo] = useState<ReferralInfo>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setInfo(await getReferralInfo());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...info, loading, failed, refresh };
}
