import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { tr } from '../i18n';

const OPTIONS: { mode: ThemeMode; label: string; bg: string; fg: string; line: string }[] = [
  { mode: 'light', label: 'Branco', bg: '#FFFFFF', fg: '#0F172A', line: '#E2E8F0' },
  { mode: 'dark', label: 'Preto', bg: '#000000', fg: '#FAFAFA', line: '#262626' },
];

/** Escolha da cor da app: só Branco ou Preto, com uma pré-visualização de cada. */
export function ThemeChoice() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      {OPTIONS.map((o) => {
        const on = o.mode === mode;
        return (
          <Pressable key={o.mode} onPress={() => setMode(o.mode)} style={[styles.card, on && styles.cardOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <View style={[styles.preview, { backgroundColor: o.bg, borderColor: o.line }]}>
              <View style={[styles.bar, { backgroundColor: o.fg }]} />
              <View style={[styles.barShort, { backgroundColor: o.line }]} />
              <View style={[styles.pill, { backgroundColor: o.fg }]} />
            </View>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{tr(o.label)}</Text>
              <View style={[styles.radio, on && styles.radioOn]}>{on && <Check size={12} color="#fff" strokeWidth={3.5} />}</View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 12 },
    card: { flex: 1, gap: 10, padding: 10, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
    cardOn: { borderColor: colors.text },
    preview: { height: 84, borderRadius: radius.md, borderWidth: 1, padding: 10, gap: 6, justifyContent: 'center' },
    bar: { height: 8, width: '70%', borderRadius: 4 },
    barShort: { height: 8, width: '45%', borderRadius: 4 },
    pill: { height: 14, width: '40%', borderRadius: 7, marginTop: 4 },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: font.body, fontWeight: '700', color: colors.text },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    radioOn: { backgroundColor: colors.text, borderColor: colors.text },
  });
