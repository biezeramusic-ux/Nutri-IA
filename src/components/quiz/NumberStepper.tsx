import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, font, radius } from '../../constants/theme';

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
          <Minus size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.value}>
          {value}
          {!!unit && <Text style={styles.unit}> {unit}</Text>}
        </Text>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => set(value + step)} hitSlop={8} accessibilityLabel={`Aumentar ${label}`}>
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...cardBase, borderRadius: radius.lg, padding: 14, gap: 6 },
  label: { fontSize: font.small, fontWeight: '500', color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  value: { fontSize: 26, fontWeight: '700', color: colors.text },
  unit: { fontSize: font.body, color: colors.textMuted, fontWeight: '500' },
});
