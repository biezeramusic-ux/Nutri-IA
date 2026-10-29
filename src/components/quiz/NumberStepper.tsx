import { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { Reveal } from './Reveal';

interface Props {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const TICKS = 21;

export function NumberStepper({ label, value, unit, min, max, step = 1, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <Reveal>
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => set(value - step)} hitSlop={8} accessibilityLabel={`Diminuir ${label}`}>
          <Minus size={22} color={colors.primary} strokeWidth={3} />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.value}>{value}</Text>
          {!!unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => set(value + step)} hitSlop={8} accessibilityLabel={`Aumentar ${label}`}>
          <Plus size={22} color="#fff" strokeWidth={3} />
        </Pressable>
      </View>
      <View style={styles.ruler}>
        {Array.from({ length: TICKS }, (_, i) => {
          const d = Math.abs(i - (TICKS - 1) / 2);
          const mid = i === (TICKS - 1) / 2;
          return <View key={i} style={[styles.tick, { height: mid ? 26 : i % 5 === 0 ? 18 : 11, opacity: mid ? 1 : Math.max(0.25, 1 - d / 10) }, mid && styles.tickMid]} />;
        })}
      </View>
    </View>
    </Reveal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: radius.card,
      padding: 16,
      gap: 10,
    },
    label: { fontSize: font.small, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    btn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: colors.primary },
    center: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    value: { fontSize: 48, lineHeight: 54, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    unit: { fontSize: font.h3, color: colors.textMuted, fontWeight: '600' },
    ruler: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 28 },
    tick: { width: 3, borderRadius: 2, backgroundColor: colors.primary },
    tickMid: { width: 4 },
  });
