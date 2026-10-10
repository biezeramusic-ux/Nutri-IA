import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { font, radius, type ThemeColors } from '../constants/theme';
import { LANGUAGES } from '../i18n';
import { useTheme } from '../hooks/useTheme';

/** Lista de idiomas com bandeira, nome e visto no selecionado. */
export function LanguageSelector() {
  const { colors, lang, setLang } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      {LANGUAGES.map((l) => {
        const on = l.id === lang;
        return (
          <Pressable key={l.id} onPress={() => setLang(l.id)} style={[styles.row, on && styles.rowOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Text style={styles.flag}>{l.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{l.name}</Text>
              <Text style={styles.hint}>{l.hint}</Text>
            </View>
            <View style={[styles.radio, on && styles.radioOn]}>{on && <Check size={13} color="#fff" strokeWidth={3.5} />}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
    rowOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    flag: { fontSize: 26 },
    name: { fontSize: font.body, fontWeight: '700', color: colors.text },
    hint: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  });
