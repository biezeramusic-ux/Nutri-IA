import { tr } from '../i18n';
import { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAnimatedTo } from './Motion';
import { Text } from '../components/AppText';
import { font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  label: string;
  /** Gramas que ainda faltam. */
  leftG: number;
  /** 0 a 1 (consumido / meta). */
  progress: number;
  color: string;
}

export function MacroLeftBar({ label, leftG, progress, color }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const filled = useAnimatedTo(Math.min(1, Math.max(0, progress)), 800, 250);
  return (
    <View style={styles.wrap}>
      <Text style={styles.value}>{Math.max(0, Math.round(leftG))}g</Text>
      <Text style={styles.label}>{tr('{label} restante', { label: tr(label) })}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: filled.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: color }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: { flex: 1, gap: 2 },
  value: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  label: { fontSize: font.tiny, color: colors.textMuted, marginBottom: 4 },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});
