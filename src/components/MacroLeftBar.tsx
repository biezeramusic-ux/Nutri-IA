import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  return (
    <View style={styles.wrap}>
      <Text style={styles.value}>{Math.max(0, Math.round(leftG))}g</Text>
      <Text style={styles.label}>{label} restante</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(1, Math.max(0, progress)) * 100}%`, backgroundColor: color }]} />
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
