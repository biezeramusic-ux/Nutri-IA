import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../../constants/theme';

interface Props {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumberStepper({ label, value, unit, min, max, step = 1, onChange }: Props) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => set(value - step)} hitSlop={8} accessibilityLabel={`Diminuir ${label}`}>
          <Ionicons name="remove" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.value}>
          {value}
          {!!unit && <Text style={styles.unit}> {unit}</Text>}
        </Text>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => set(value + step)} hitSlop={8} accessibilityLabel={`Aumentar ${label}`}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.card, borderRadius: radius.card, padding: 18, gap: 10, ...shadow },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  value: { fontSize: 38, fontWeight: '800', color: colors.text },
  unit: { fontSize: 16, color: colors.textMuted, fontWeight: '700' },
});
