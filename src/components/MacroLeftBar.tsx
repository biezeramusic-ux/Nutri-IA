import { tr } from '../i18n';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
  /** Sem meta: mostra só os gramas consumidos (em leftG), sem barra. */
  noGoal?: boolean;
}

export function MacroLeftBar({ label, leftG, progress, color, noGoal }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.value}>{Math.max(0, Math.round(leftG))}g</Text>
      <Text style={styles.label}>{noGoal ? tr(label) : tr('{label} restante', { label: tr(label) })}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: noGoal ? '100%' : `${Math.min(1, Math.max(0, progress)) * 100}%`, backgroundColor: color, opacity: noGoal ? 0.35 : 1 }]} />
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
