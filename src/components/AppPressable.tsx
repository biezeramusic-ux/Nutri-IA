import { useRef, useState } from 'react';
import { Animated, Platform, Pressable as RNPressable, type PressableProps, type PressableStateCallbackType } from 'react-native';

const APressable = Animated.createAnimatedComponent(RNPressable);

/** Pressable com resposta ao toque: encolhe um pouco ao carregar e volta com mola. */
export function Pressable({ style, onPressIn, onPressOut, ...rest }: PressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: Platform.OS !== 'web', speed: 45, bounciness: 6 }).start();
  // O componente animado não aceita style como função: resolve-se aqui com o estado "pressed".
  const resolved = typeof style === 'function' ? style({ pressed } as PressableStateCallbackType) : style;
  return (
    <APressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        to(0.96);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        to(1);
        onPressOut?.(e);
      }}
      style={[resolved, { transform: [{ scale }] }] as never}
    />
  );
}
