import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, font, radius } from '../constants/theme';
import type { LockReason } from '../types';

const MESSAGES: Record<Exclude<LockReason, null>, { title: string; body: string }> = {
  trial_expired: {
    title: 'O seu teste gratuito terminou',
    body: 'Assine o Nutri IA para continuar a contar calorias sem limites.',
  },
  daily_limit: {
    title: 'Limite diário atingido',
    body: 'No teste gratuito pode fazer scans limitados por dia. Assine para scans ilimitados.',
  },
};

/** Efeito de vidro fosco que "congela" a funcionalidade e abre o paywall. */
export function LockOverlay({ reason }: { reason: Exclude<LockReason, null> }) {
  const router = useRouter();
  const { title, body } = MESSAGES[reason];
  return (
    <BlurView intensity={45} tint="light" style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Lock size={22} color={colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable style={styles.button} onPress={() => router.push('/paywall')}>
            <Text style={styles.buttonText}>Desbloquear Nutri IA</Text>
          </Pressable>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { ...cardBase, padding: 20, alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  iconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  title: { fontSize: font.h2, fontWeight: '700', color: colors.text, textAlign: 'center' },
  body: { fontSize: font.body, color: colors.textMuted, textAlign: 'center', marginBottom: 6, lineHeight: 20 },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, height: 46, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: font.body },
});
