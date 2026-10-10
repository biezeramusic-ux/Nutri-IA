import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './AppText';

export const useNative = Platform.OS !== 'web';

/** Entrada suave: o bloco sobe uns pixéis e aparece. Use `delay` para encadear vários blocos. */
export function FadeInUp({ children, delay = 0, style, distance = 16 }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; distance?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 480, delay, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }).start();
  }, [a, delay]);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Valor animado (JS) que acompanha `target`, útil para barras e anéis. */
export function useAnimatedTo(target: number, duration = 700, delay = 0): Animated.Value {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: target, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [v, target, duration, delay]);
  return v;
}

/** Número que sobe (ou desce) suavemente até ao novo valor. */
export function AnimatedNumber({ value, style, prefix = '' }: { value: number; style?: object; prefix?: string }) {
  const v = useRef(new Animated.Value(0)).current;
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = v.addListener(({ value: x }) => setN(Math.round(x)));
    Animated.timing(v, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [v, value]);
  return (
    <Text style={style}>
      {prefix}
      {n}
    </Text>
  );
}

/** Pulsação contínua e discreta (usada na chama e no botão do scanner). */
export function usePulse(min = 1, max = 1.08, duration = 1100): Animated.Value {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: useNative }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: useNative }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return v.interpolate({ inputRange: [0, 1], outputRange: [min, max] }) as unknown as Animated.Value;
}
