import { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: { ...cardBase(colors), borderRadius: radius.lg, padding: 14, gap: 6 },
  label: { fontSize: font.small, fontWeight: '500', color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  value: { fontSize: 26, fontWeight: '700', color: colors.text },
  unit: { fontSize: font.body, color: colors.textMuted, fontWeight: '500' },
});
