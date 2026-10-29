import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

/** Dentro do quiz, cada elemento entra devagar, um a seguir ao outro. Fora do quiz não faz nada. */
const Ctx = createContext<{ next: () => number } | null>(null);

export function RevealProvider({ stepKey, children }: { stepKey: string; children: ReactNode }) {
  const value = useMemo(() => {
    let n = 0;
    return { next: () => n++ };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function Reveal({ children, style, base = 900 }: { children: ReactNode; style?: StyleProp<ViewStyle>; base?: number }) {
  const ctx = useContext(Ctx);
  const [idx] = useState(() => (ctx ? ctx.next() : 0));
  const v = useRef(new Animated.Value(ctx ? 0 : 1)).current;
  useEffect(() => {
    if (!ctx) return;
    Animated.timing(v, { toValue: 1, duration: 700, delay: base + Math.min(idx, 10) * 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!ctx) return <>{children}</>;
  return <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }] }, style]}>{children}</Animated.View>;
}
