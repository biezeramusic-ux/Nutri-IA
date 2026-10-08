import { useMemo, type ReactNode } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { isSupabaseConfigured } from '../services/supabase';
import { Logo } from './Logo';

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
    <ImageBackground source={require('../../assets/auth-bg.jpg')} style={styles.root} resizeMode="cover">
      <View style={styles.shade} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 16,
            gap: 12,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logoBubble}>
              <Logo size={34} />
            </View>
            <Text style={styles.brandText}>Nutri IA</Text>
          </View>
          {!isSupabaseConfigured && (
            <Text style={styles.config}>
              Supabase não configurado. Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env e reinicie.
            </Text>
          )}
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.12)' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 'auto' },
  logoBubble: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: font.h2, fontWeight: '700', color: '#fff' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.card + 4,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    padding: 20,
    gap: 14,
  },
  title: { fontSize: font.h1, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: font.body, color: colors.textMuted, marginTop: -6, lineHeight: 20 },
  config: {
    fontSize: font.small,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 10,
    textAlign: 'center',
  },
});
