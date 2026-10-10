import { useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { Camera } from 'lucide-react-native';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useNative } from './Motion';
import { type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';

interface Props {
  onPress?: (...args: never[]) => void;
  accessibilityState?: { selected?: boolean };
}

/** Botão central circular e proeminente da barra de abas. */
export function ScannerFab({ onPress, accessibilityState }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const focused = accessibilityState?.selected;
  const halo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(halo, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: useNative }));
    loop.start();
    return () => loop.stop();
  }, [halo]);
  return (
    <View style={styles.slot}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.haloRing,
          { opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }), transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }] },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tr('Scanner')}
        onPress={(e) => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          (onPress as ((ev: unknown) => void) | undefined)?.(e);
        }}
        style={({ pressed }) => [styles.fab, focused && styles.focused, pressed && styles.pressed]}
      >
        <Camera size={24} color="#fff" strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  slot: { flex: 1, alignItems: 'center' },
  fab: {
    position: 'absolute',
    top: -22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  haloRing: { position: 'absolute', top: -22, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary },
  focused: { backgroundColor: colors.primaryDark },
  pressed: { transform: [{ scale: 0.95 }] },
});
