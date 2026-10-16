import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { readHealthConnectSteps } from '../services/healthConnect';
import { connectSteps, disconnectSteps, getStepsSource, type ConnectResult, type StepsSource } from '../services/stepsConnection';

/**
 * Passos automáticos. Google Health Connect (Android): passos do dia inteiro, mesmo com a app fechada.
 * Sem Health Connect: iPhone lê o dia inteiro; Android soma os passos dados enquanto a app está aberta.
 */
export function useStepsTracking(setSteps: (fn: (prev: number) => number) => void) {
  const [source, setSource] = useState<StepsSource | null>(null);
  const last = useRef(0);

  useEffect(() => {
    let alive = true;
    void getStepsSource().then((s) => alive && setSource(s));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!source) return;
    if (source === 'healthconnect') {
      const read = async () => {
        const n = await readHealthConnectSteps();
        if (n !== null) setSteps((prev) => Math.max(prev, n));
      };
      void read();
      const t = setInterval(() => void read(), 60000);
      return () => clearInterval(t);
    }
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
  }, [source, setSteps]);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    const r = await connectSteps();
    if (r.status === 'ok') setSource(r.source);
    return r;
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectSteps();
    setSource(null);
  }, []);

  return { connected: source !== null, source, connect, disconnect };
}
