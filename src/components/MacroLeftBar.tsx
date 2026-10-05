import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  label: string;
  /** Gramas que ainda faltam. */
  leftG: number;
  /** 0 a 1 (consumido / meta). */
  progress: number;
  color: string;
}

export function MacroLeftBar({ label, leftG, progress, color }: Props) {
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

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 2 },
  value: { fontSize: 17, fontWeight: '800', color: colors.text },
  label: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
