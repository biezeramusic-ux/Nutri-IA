import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';
import type { LockReason } from '../types';

const MESSAGES: Record<Exclude<LockReason, null>, { title: string; body: string }> = {
  trial_expired: {
    title: 'O seu teste gratuito terminou',
    body: 'Assine o Nutri AI para continuar a contar calorias sem limites.',
  },
  daily_limit: {
    title: 'Limite diário atingido',
    body: 'No teste gratuito pode fazer 2 scans por dia. Assine para scans ilimitados.',
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
            <Ionicons name="lock-closed" size={26} color={colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable style={styles.button} onPress={() => router.push('/paywall')}>
            <Text style={styles.buttonText}>Desbloquear Nutri AI</Text>
          </Pressable>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...shadow,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 8 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
