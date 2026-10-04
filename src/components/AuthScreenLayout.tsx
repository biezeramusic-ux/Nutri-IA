import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { isSupabaseConfigured } from '../services/supabase';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Estrutura partilhada por login e registo (logo, títulos, teclado). */
export function AuthScreenLayout({ title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();
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
          <View style={styles.logo}>
            <Ionicons name="leaf" size={34} color="#fff" />
          </View>
          <Text style={styles.brand}>Nutri AI</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {!isSupabaseConfigured && (
          <Text style={styles.config}>
            ⚠️ Supabase não configurado. Preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env e
            reinicie.
          </Text>
        )}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', gap: 6, marginBottom: 8 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brand: { fontSize: 14, fontWeight: '800', color: colors.primaryDark, letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  config: {
    fontSize: 12,
    color: colors.danger,
    backgroundColor: '#FDECEA',
    borderRadius: 16,
    padding: 12,
    textAlign: 'center',
  },
});
