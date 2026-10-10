import { Globe } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../components/AppText';
import { font, radius, type ThemeColors } from '../constants/theme';
import { LANGUAGES } from '../i18n';
import { useTheme } from '../hooks/useTheme';

/** Botão pequeno para trocar de idioma (usado nos ecrãs de entrada, antes de haver perfil). */
export function LanguagePill() {
  const { colors, lang, setLang } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const current = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];
  const next = LANGUAGES.find((l) => l.id !== lang) ?? LANGUAGES[0];
  return (
    <Pressable style={styles.pill} onPress={() => setLang(next.id)} accessibilityRole="button" accessibilityLabel={next.name}>
      <Globe size={14} color="#fff" />
      <Text style={styles.text}>
        {current.flag} {current.id.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: radius.pill, paddingHorizontal: 12, height: 34 },
    text: { color: '#fff', fontSize: font.small, fontWeight: '700' },
  });
