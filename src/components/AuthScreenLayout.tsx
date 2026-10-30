import { useMemo, type ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { isSupabaseConfigured } from '../services/supabase';
import { AuthPhotoBackdrop } from './AuthPhotoBackdrop';
import { LanguagePill } from './LanguagePill';
import { Logo } from './Logo';
import { tr } from '../i18n';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Estrutura partilhada por login e registo: fotografia de fundo (assets/auth-bg.jpg),
 * marca no topo e o formulário num cartão no fundo do ecrã.
 */
export function AuthScreenLayout({ title, subtitle, children }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Atrás: fotografias em movimento. Por cima: a camada verde (translúcida). */}
      <AuthPhotoBackdrop />
      <Image source={require('../../assets/auth-bg.jpg')} style={styles.green} resizeMode="cover" />
      <View style={styles.shade} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 10,
            paddingHorizontal: 12,
            gap: 10,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logoBubble}>
              <Logo size={34} />
            </View>
            <Text style={styles.brandText}>{tr('Nutrifitness AI')}</Text>
            <View style={{ marginLeft: 'auto' }}>
              <LanguagePill />
            </View>
          </View>
          {!isSupabaseConfigured && (
            <Text style={styles.config}>{tr('Supabase não configurado. Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env e reinicie.')}</Text>
          )}
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  green: { ...StyleSheet.absoluteFill, width: undefined, height: undefined, opacity: 0.1 },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.02)' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 'auto' },
  logoBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: font.h2, fontWeight: '700', color: '#fff' },
  card: {
    backgroundColor: `${colors.card}EE`,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    padding: 14,
    gap: 8,
  },
  title: { fontSize: font.h2, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: font.small, color: colors.textMuted, marginTop: -4, lineHeight: 17 },
  config: {
    fontSize: font.small,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 10,
    textAlign: 'center',
  },
});
