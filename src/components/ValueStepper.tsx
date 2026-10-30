import { Minus, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/** Seletor de número para o Perfil, objetivos, porção e peso: etiqueta, valor grande, botões redondos e uma barra com a posição dentro do intervalo. */
export function ValueStepper({ label, value, unit, min, max, step = 1, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const set = (next: number) => onChange(Math.round(Math.min(max, Math.max(min, next)) * 100) / 100);
  const frac = Math.max(0, Math.min(1, (value - min) / Math.max(1e-9, max - min)));
  return (
    <View style={styles.card}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.row}>
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]} onPress={() => set(value - step)} hitSlop={8} accessibilityLabel={`Diminuir ${label}`}>
          <Minus size={20} color={colors.text} strokeWidth={2.6} />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.value}>{Number.isInteger(value) ? value : String(value).replace('.', ',')}</Text>
          {!!unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnOn, pressed && { opacity: 0.85 }]} onPress={() => set(value + step)} hitSlop={8} accessibilityLabel={`Aumentar ${label}`}>
          <Plus size={20} color="#fff" strokeWidth={2.6} />
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(4, frac * 100)}%` }]} />
        <View style={[styles.thumb, { left: `${frac * 100}%` }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    label: { fontSize: font.small, fontWeight: '600', color: colors.textMuted, lineHeight: 17 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    btn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    btnOn: { backgroundColor: colors.primary },
    center: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    value: { fontSize: 38, lineHeight: 44, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    unit: { fontSize: font.body, fontWeight: '600', color: colors.textMuted },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.surface, marginHorizontal: 4 },
    fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
    thumb: { position: 'absolute', top: -4, marginLeft: -7, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.card, borderWidth: 3, borderColor: colors.primary },
  });
