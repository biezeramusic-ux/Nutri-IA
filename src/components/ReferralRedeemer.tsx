import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { redeemReferral } from '../services/repositories/referral';

/**
 * Se a conta foi criada com um código de convite (guardado nos metadados do registo),
 * usa-o uma vez, no primeiro início de sessão. Não desenha nada.
 */
export function ReferralRedeemer() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const code = user?.user_metadata?.referral_code;

  useEffect(() => {
    if (!userId || typeof code !== 'string' || !code) return;
    const flag = `nutria.referral.done.${userId}`;
    let cancelled = false;
    void (async () => {
      try {
        if (await AsyncStorage.getItem(flag)) return;
        await redeemReferral(code); // resultado final (ok ou recusado) também encerra a tentativa
        if (!cancelled) await AsyncStorage.setItem(flag, '1');
      } catch {
        // sem rede: tenta outra vez no próximo arranque
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, code]);

  return null;
}
