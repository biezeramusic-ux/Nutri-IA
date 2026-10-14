import { Globe, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { font, radius, type ThemeColors } from '../constants/theme';
import { LANGUAGES } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { LanguageSelector } from './LanguageSelector';

/** Botão pequeno para trocar de idioma (usado nos ecrãs de entrada, antes de haver perfil). Abre a lista de idiomas. */
export function LanguagePill() {
  const { colors, lang } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];
  return (
    <>
      <Pressable style={styles.pill} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={current.name}>
        <Globe size={14} color="#fff" />
        <Text style={styles.text}>
          {current.flag} {current.id.toUpperCase()}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.head}>
              <Text style={styles.title}>Idioma</Text>
              <Pressable onPress={() => setOpen(false)} accessibilityLabel="Fechar" hitSlop={10}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <LanguageSelector onPicked={() => setOpen(false)} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: radius.pill, paddingHorizontal: 12, height: 34 },
    text: { color: '#fff', fontSize: font.small, fontWeight: '700' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
    sheet: { backgroundColor: colors.background, borderRadius: radius.card, padding: 16, maxHeight: '80%' },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    title: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  });
