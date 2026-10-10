import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { ACCENTS, font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';

/** Bolinhas de cor para escolher a cor da app (verde, azul, roxo, laranja, rosa ou preto). */
export function AccentPicker() {
  const { colors, accent, setAccent } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      {ACCENTS.map((a) => {
        const on = a.id === accent;
        return (
          <Pressable key={a.id} onPress={() => setAccent(a.id)} style={styles.item} accessibilityRole="button" accessibilityLabel={tr(a.label)} accessibilityState={{ selected: on }}>
            <View style={[styles.dot, { backgroundColor: a.swatch }, on && styles.dotOn]}>{on && <Check size={16} color="#fff" strokeWidth={3.5} />}</View>
            <Text style={[styles.label, on && styles.labelOn]}>{tr(a.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    item: { alignItems: 'center', gap: 6, flex: 1 },
    dot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
    dotOn: { borderColor: colors.card, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    label: { fontSize: font.tiny, color: colors.textMuted },
    labelOn: { color: colors.text, fontWeight: '700' },
  });
