import type { ReactNode } from 'react';
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
import { colors, radius } from '../constants/theme';
import { isSupabaseConfigured } from '../services/supabase';
import { Logo } from './Logo';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Usa a fotografia de fundo (assets/auth-bg.jpg) em vez do fundo claro. */
  photo?: boolean;
}

/** Estrutura partilhada por login e registo (logo, títulos, teclado). */
export function AuthScreenLayout({ title, subtitle, children, photo }: Props) {
  const insets = useSafeAreaInsets();

  const configWarning = !isSupabaseConfigured && (
    <Text style={styles.config}>
      ⚠️ Supabase não configurado. Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env e reinicie.
    </Text>
  );

  if (photo) {
    return (
      <ImageBackground source={require('../../assets/auth-bg.jpg')} style={styles.root} resizeMode="cover">
        <View style={styles.shade} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'flex-end',
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 20,
              paddingHorizontal: 18,
              gap: 14,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.photoBrand}>
              <View style={styles.logoBubble}>
                <Logo size={44} />
              </View>
              <Text style={styles.photoBrandText}>Nutri AI</Text>
            </View>
            {configWarning}
            <View style={styles.glass}>
              <Text style={styles.title}>{title}</Text>
              <Text style={[styles.subtitle, { marginBottom: 6 }]}>{subtitle}</Text>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
          gap: 18,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Logo size={84} />
          <Text style={styles.brand}>Nutri AI</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {configWarning}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.18)' },
  hero: { alignItems: 'center', gap: 6, marginBottom: 8 },
  brand: { fontSize: 14, fontWeight: '800', color: colors.primaryDark, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  photoBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 'auto' },
  logoBubble: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  photoBrandText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  glass: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.card + 4, padding: 20, gap: 14 },
  config: {
    fontSize: 12,
    color: colors.danger,
    backgroundColor: '#FDECEA',
    borderRadius: 16,
    padding: 12,
    textAlign: 'center',
  },
});
