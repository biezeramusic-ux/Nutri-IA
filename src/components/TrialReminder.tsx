import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Crown, TriangleAlert } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TRIAL_DAYS } from '../constants/plans';
import { font, type ThemeColors } from '../constants/theme';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import { Text } from './AppText';

/** Aviso do teste grátis: calmo no início, âmbar no último dia e vermelho quando terminou. Toque para ver os planos. */
export function TrialReminder() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { isPremium, trialDaysLeft, lockReason, loading } = useSubscription();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (isPremium || loading) return null;
  // Durante o teste normal não mostra nada: só avisa no último dia e quando terminou.
  if (lockReason !== 'trial_expired' && trialDaysLeft > 1) return null;

  const expired = lockReason === 'trial_expired';
  const last = !expired && trialDaysLeft <= 1;
  const tone = expired
    ? { bg: colors.dangerSoft, fg: colors.danger, Icon: TriangleAlert }
    : last
      ? { bg: isDark ? '#2B2410' : '#FEF3C7', fg: isDark ? '#FBBF24' : '#B45309', Icon: Clock }
      : { bg: colors.primarySoft, fg: colors.primaryDark, Icon: Crown };
  const title = expired
    ? tr('O seu teste terminou')
    : last
      ? tr('Último dia do teste grátis')
      : tr('Teste grátis: {n} dias restantes', { n: trialDaysLeft });
  const body = expired ? tr('Escolha um plano para continuar a registar e analisar as suas refeições.') : tr('Ao terminar, os scans e os registos ficam bloqueados. Veja os planos Pro.');

  return (
    <Pressable onPress={() => router.push('/paywall')} style={({ pressed }) => [styles.card, { backgroundColor: tone.bg }, pressed && { opacity: 0.9 }]} accessibilityRole="button">
      <View style={[styles.icon, { backgroundColor: colors.card }]}>
        <tone.Icon size={20} color={tone.fg} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={[styles.title, { color: tone.fg }]}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {!expired && (
          <View style={styles.dots}>
            {Array.from({ length: TRIAL_DAYS }, (_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i < trialDaysLeft ? tone.fg : colors.card }]} />
            ))}
          </View>
        )}
      </View>
      <View style={[styles.go, { backgroundColor: tone.fg }]}>
        <ChevronRight size={18} color="#fff" />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 14 },
    icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: font.body, fontWeight: '800' },
    body: { fontSize: font.small, color: colors.textMuted, lineHeight: 17 },
    dots: { flexDirection: 'row', gap: 5, marginTop: 2 },
    dot: { flex: 1, maxWidth: 40, height: 6, borderRadius: 3 },
    go: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  });
