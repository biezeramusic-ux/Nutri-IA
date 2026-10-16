import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { connectSteps, disconnectSteps, isStepsConnected, type ConnectResult } from '../services/stepsConnection';

/**
 * Passos automáticos pelo sensor do telemóvel (depois de ligar o Nutri Saúde).
 * iPhone: lê os passos do dia inteiro. Android: soma os passos dados enquanto a app está aberta.
 */
export function useStepsTracking(setSteps: (fn: (prev: number) => number) => void) {
  const [connected, setConnected] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    let alive = true;
    void isStepsConnected().then((c) => alive && setConnected(c));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!connected) return;
    if (Platform.OS === 'ios') {
      const read = async () => {
        try {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const { steps } = await Pedometer.getStepCountAsync(start, new Date());
          setSteps((prev) => Math.max(prev, steps));
        } catch {
          // sem permissão ou sem dados
        }
      };
      void read();
      const t = setInterval(() => void read(), 30000);
      return () => clearInterval(t);
    }
    last.current = 0;
    const sub = Pedometer.watchStepCount((e) => {
      const delta = e.steps - last.current;
      last.current = e.steps;
      if (delta > 0) setSteps((prev) => prev + delta);
    });
    return () => sub.remove();
  }, [connected, setSteps]);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    const r = await connectSteps();
    if (r === 'ok') setConnected(true);
    return r;
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectSteps();
    setConnected(false);
  }, []);

  return { connected, connect, disconnect };
}
