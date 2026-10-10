import { useRouter } from 'expo-router';
import { Check, Crown } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FREE_MEALS_TOTAL, PLANS, TRIAL_DAYS } from '../constants/plans';
import { font, formatMT, radius, type ThemeColors } from '../constants/theme';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import { Text } from './AppText';

const BENEFITS = ['Análises e registos ilimitados', 'Fibras, progresso e histórico', 'Água, atividade e objetivos'];

/** Cartão do plano no Perfil: estado, progresso do teste, o que ainda tem e o botão certo para cada caso. */
export function SubscriptionCard() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { isPremium, trialDaysLeft, lockReason, scansLeftToday, mealsLeft } = useSubscription();

  const expired = !isPremium && lockReason === 'trial_expired';
  const title = isPremium ? 'Nutri IA Pro' : expired ? 'Teste terminado' : 'Teste grátis';
  const big = isPremium
    ? tr('Ativo')
    : expired
      ? tr('Desbloqueie o Pro')
      : tr(trialDaysLeft === 1 ? '1 dia restante' : '{n} dias restantes', { n: trialDaysLeft });
  const cta = isPremium ? 'Prolongar plano' : expired ? 'Desbloquear Pro' : 'Ver planos Pro';
  const progress = isPremium ? 1 : expired ? 0 : Math.min(1, Math.max(0, trialDaysLeft / TRIAL_DAYS));

  return (
    <View style={styles.card}>
      <View style={styles.decoA} />
      <View style={styles.head}>
        <View style={[styles.crown, isPremium && styles.crownOn]}>
          <Crown size={20} color={isPremium ? '#1A1A1A' : colors.lime} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{tr('Plano atual')}</Text>
          <Text style={styles.title}>{tr(title)}</Text>
        </View>
        <View style={[styles.status, expired && styles.statusOff]}>
          <Text style={[styles.statusText, expired && styles.statusTextOff]}>{big}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }, expired && { backgroundColor: colors.danger }]} />
      </View>

      {!isPremium && !expired && (
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{tr('{n} análises restantes hoje', { n: scansLeftToday ?? 0 })}</Text>
          </View>
          {mealsLeft !== null && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{tr('{n} de {total} registos disponíveis', { n: Math.max(0, mealsLeft), total: FREE_MEALS_TOTAL })}</Text>
            </View>
          )}
        </View>
      )}

      {!isPremium && (
        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefit}>
              <View style={styles.tick}>
                <Check size={12} color="#1A1A1A" strokeWidth={3.5} />
              </View>
              <Text style={styles.benefitText}>{tr(b)}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]} onPress={() => router.push('/paywall')}>
        <Text style={styles.ctaText}>{tr(cta)}</Text>
      </Pressable>
      {!isPremium && <Text style={styles.hint}>{tr('A partir de {price} MT por semana', { price: formatMT(PLANS[0].priceMT) })}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.hero, borderRadius: radius.card, padding: 18, gap: 14, overflow: 'hidden' },
    decoA: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: colors.lime, opacity: 0.1, top: -70, right: -50 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    crown: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    crownOn: { backgroundColor: colors.lime },
    kicker: { color: 'rgba(255,255,255,0.6)', fontSize: font.tiny, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    title: { color: '#fff', fontSize: font.h2, fontWeight: '800' },
    status: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    statusOff: { backgroundColor: 'rgba(239,68,68,0.2)' },
    statusText: { color: '#fff', fontSize: font.small, fontWeight: '700' },
    statusTextOff: { color: '#FCA5A5' },
    track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
    fill: { height: 6, borderRadius: 3, backgroundColor: colors.lime },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
    chipText: { color: 'rgba(255,255,255,0.85)', fontSize: font.tiny, fontWeight: '600' },
    benefits: { gap: 8 },
    benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tick: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
    benefitText: { color: 'rgba(255,255,255,0.9)', fontSize: font.body },
    cta: { backgroundColor: colors.lime, borderRadius: radius.md, height: 48, alignItems: 'center', justifyContent: 'center' },
    ctaText: { color: '#1A1A1A', fontSize: font.body, fontWeight: '800' },
    hint: { color: 'rgba(255,255,255,0.55)', fontSize: font.tiny, textAlign: 'center', marginTop: -4 },
  });
