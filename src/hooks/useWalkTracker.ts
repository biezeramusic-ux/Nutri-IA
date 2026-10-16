import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { distanceBetween, type RoutePoint } from '../services/walks';

/** Segue a caminhada com o GPS (com a app aberta): rota, distância e tempo. */
export function useWalkTracker() {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [active, setActive] = useState(false);
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [distanceM, setDistanceM] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(0);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const lastRef = useRef<RoutePoint | null>(null);

  useEffect(() => {
    let alive = true;
    void Location.getForegroundPermissionsAsync().then((p) => alive && setGranted(p.granted)).catch(() => alive && setGranted(false));
    return () => {
      alive = false;
      subRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setElapsedMs(Date.now() - startRef.current), 1000);
    return () => clearInterval(t);
  }, [active]);

  const requestPermission = useCallback(async () => {
    const p = await Location.requestForegroundPermissionsAsync();
    setGranted(p.granted);
    return p.granted;
  }, []);

  const start = useCallback(async () => {
    if (!(granted || (await requestPermission()))) return false;
    setPoints([]);
    setDistanceM(0);
    setElapsedMs(0);
    lastRef.current = null;
    startRef.current = Date.now();
    setActive(true);
    subRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 4, timeInterval: 2000 },
      (loc) => {
        const p: RoutePoint = { lat: loc.coords.latitude, lng: loc.coords.longitude, t: loc.timestamp };
        // Ignora leituras imprecisas ou saltos impossíveis (GPS a falhar).
        if ((loc.coords.accuracy ?? 0) > 35) return;
        const last = lastRef.current;
        if (last) {
          const d = distanceBetween(last, p);
          const dt = Math.max(1, (p.t - last.t) / 1000);
          if (d < 2 || d / dt > 12) return;
          setDistanceM((m) => m + d);
        }
        lastRef.current = p;
        setPoints((prev) => [...prev, p]);
      },
    );
    return true;
  }, [granted, requestPermission]);

  const stop = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    setActive(false);
    return { startedAt: startRef.current, endedAt: Date.now() };
  }, []);

  return { granted, active, points, distanceM, elapsedMs, requestPermission, start, stop };
}
