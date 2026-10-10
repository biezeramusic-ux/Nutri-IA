import { useRouter } from 'expo-router';
import { Activity, Check, Droplets, Gift, Infinity as InfinityIcon, Leaf, Lock, Minus, ShieldCheck, TrendingUp, UtensilsCrossed, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { Text } from '../components/AppText';
import { Alert } from '../i18n/alert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { PaymentLogo } from '../components/PaymentLogos';
import { PlanCard, discountedPrice } from '../components/PlanCard';
import { PLANS } from '../constants/plans';
import { SCREEN_PADDING, font, formatMT, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useReferral } from '../hooks/useReferral';
import { useSubscription } from '../hooks/useSubscription';
import { payWithCard, payWithEmola, payWithMpesa, type PaymentResult } from '../services/payments';
import type { PlanId } from '../types';
import { tr } from '../i18n';
import { FadeInUp } from '../components/Motion';

type Method = 'mpesa' | 'emola' | 'card';

const HIGHLIGHTS = [
  { emoji: '♾️', text: 'Análises e registos ilimitados' },
  { emoji: '🌿', text: 'Fibras e análise detalhada' },
  { emoji: '📈', text: 'Progresso e objetivos' },
  { emoji: '💧', text: 'Registo de água' },
  { emoji: '🏃', text: 'Atividade física' },
  { emoji: '🍲', text: 'Pratos moçambicanos' },
] as const;

/** [recurso, grátis, pro] — texto = valor, true/false = tem/não tem. */
const COMPARE: [string, string | boolean, string | boolean][] = [
  ['Análises de refeições', '2 por dia', 'Ilimitadas'],
  ['Registos de refeições', '5 no total', 'Ilimitados'],
  ['Calorias e macros', true, true],
  ['Fibras e análise detalhada', false, true],
  ['Progresso e histórico completo', false, true],
  ['Água e atividade física', false, true],
  ['Duração', '3 dias', 'Enquanto durar o plano'],
];

const METHODS: { id: Method; label: string; hint: string }[] = [
  { id: 'mpesa', label: 'M-Pesa', hint: 'Vodacom · 84 / 85' },
  { id: 'emola', label: 'e-Mola', hint: 'Movitel · 86 / 87' },
  { id: 'card', label: 'Cartão bancário', hint: 'Visa, Mastercard, IBAN' },
];

function Cell({ value, pro }: { value: string | boolean; pro?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (typeof value === 'boolean') {
    return value ? <Check size={16} color={pro ? colors.primaryDark : colors.textFaint} strokeWidth={3} /> : <Minus size={16} color={colors.textFaint} />;
  }
  return <Text style={[styles.cellText, pro && styles.cellPro]}>{value}</Text>;
}

export default function PaywallScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activatePlan } = useSubscription();
  const { discountPct, invited, needed } = useReferral();
  const [planId, setPlanId] = useState<PlanId>('monthly');
  const [method, setMethod] = useState<Method>('mpesa');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const basePlan = PLANS.find((p) => p.id === planId) ?? PLANS[1];
  const plan = { ...basePlan, priceMT: discountedPrice(basePlan.priceMT, discountPct) };

  const pay = async () => {
    setLoading(true);
    let result: PaymentResult;
    if (method === 'mpesa') result = await payWithMpesa(plan, phone);
    else if (method === 'emola') result = await payWithEmola(plan, phone);
    else result = await payWithCard(plan);
    if (!result.success) {
      setLoading(false);
      Alert.alert(tr('Pagamento não concluído'), result.error ?? 'Tente novamente.');
      return;
    }
    try {
      await activatePlan(plan.id);
    } catch (e) {
      setLoading(false);
      Alert.alert(tr('Não foi possível ativar o plano'), e instanceof Error ? e.message : 'Tente novamente.');
      return;
    }
    setLoading(false);
    Alert.alert(tr('Bem-vindo ao Nutri IA Pro'), tr('Plano {plan} ativo.', { plan: tr(plan.label) }) + `\nRef.: ${result.reference} ${tr('(pagamento simulado)')}`);
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.decoA} />
          <View style={styles.decoB} />
          <Pressable style={styles.close} onPress={() => router.back()} accessibilityLabel={tr('Fechar')}>
            <X size={18} color="#fff" />
          </Pressable>
          <View style={styles.logoWrap}>
            <Logo size={44} />
          </View>
          <Text style={styles.title}>{tr('Nutri IA Pro 👑')}</Text>
          <Text style={styles.subtitle}>{tr('Coma melhor, sem adivinhar. Todos os planos têm os mesmos recursos.')}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.grid}>
            {HIGHLIGHTS.map(({ emoji, text }, idx) => (
              <FadeInUp key={text} delay={idx * 70} style={styles.tile}>
                <View style={styles.tileIcon}>
                  <Text style={{ fontSize: 15 }}>{emoji}</Text>
                </View>
                <Text style={styles.tileText}>{text}</Text>
              </FadeInUp>
            ))}
          </View>

          <Text style={styles.section}>{tr('Escolha o seu plano')}</Text>
          <Pressable style={[styles.promo, discountPct > 0 && styles.promoOn]} onPress={() => router.push('/invite')}>
            <Gift size={16} color={colors.primaryDark} />
            <Text style={styles.promoText}>
              {discountPct > 0
                ? tr('Desconto de {pct}% aplicado pelos seus convites.', { pct: discountPct })
                : tr('Convide {needed} amigos e ganhe 5% de desconto ({invited}/{needed}).', { needed, invited })}
            </Text>
          </Pressable>
          <View style={styles.plansRow}>
            {PLANS.map((p, idx) => (
              <FadeInUp key={p.id} delay={350 + idx * 90} style={{ flex: 1 }}>
                <PlanCard plan={p} selected={p.id === planId} onPress={() => setPlanId(p.id)} discountPct={discountPct} />
              </FadeInUp>
            ))}
          </View>

          <Text style={styles.section}>{tr('Grátis vs Pro')}</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.headRow]}>
              <Text style={[styles.rowLabel, styles.headText]} />
              <Text style={[styles.col, styles.headText]}>{tr('Grátis')}</Text>
              <Text style={[styles.col, styles.headText, styles.cellPro]}>{tr('Pro')}</Text>
            </View>
            {COMPARE.map(([label, free, pro], i) => (
              <View key={label} style={[styles.row, i < COMPARE.length - 1 && styles.rowLine]}>
                <Text style={styles.rowLabel}>{label}</Text>
                <View style={styles.col}>
                  <Cell value={free} />
                </View>
                <View style={styles.col}>
                  <Cell value={pro} pro />
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.section}>{tr('Como quer pagar?')}</Text>
          <View style={styles.methods}>
            {METHODS.map((m) => {
              const on = method === m.id;
              return (
                <Pressable key={m.id} onPress={() => setMethod(m.id)} style={[styles.method, on && styles.methodOn]}>
                  {m.id === 'card' ? (
                    <View style={styles.cardLogos}>
                      <PaymentLogo brand="visa" height={26} />
                      <PaymentLogo brand="mastercard" height={26} />
                    </View>
                  ) : (
                    <PaymentLogo brand={m.id} height={30} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodText}>{m.label}</Text>
                    <Text style={styles.methodHint}>{m.hint}</Text>
                  </View>
                  <View style={[styles.radio, on && styles.radioOn]}>{on && <Check size={12} color="#fff" strokeWidth={3.5} />}</View>
                </Pressable>
              );
            })}
          </View>
          {method !== 'card' && (
            <View style={styles.phoneField}>
              <Text style={styles.prefix}>+258</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder={method === 'mpesa' ? '84 123 4567' : '86 123 4567'}
                placeholderTextColor={colors.textFaint}
                style={styles.phoneInput}
                maxLength={13}
              />
            </View>
          )}

          <View style={styles.secure}>
            <ShieldCheck size={14} color={colors.textMuted} />
            <Text style={styles.secureText}>{tr('Pagamento seguro · cancele quando quiser')}</Text>
          </View>
          <Text style={styles.disclaimer}>{tr('MVP: os pagamentos estão simulados e nenhuma cobrança real é efetuada.')}</Text>
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={() => void pay()} disabled={loading} style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.ctaRow}>
              <Lock size={16} color="#fff" />
              <Text style={styles.ctaText}>
                {tr('Pagar')} {formatMT(plan.priceMT)} MT {tr(plan.period)}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.hero, paddingHorizontal: SCREEN_PADDING, paddingBottom: 30, alignItems: 'center', gap: 6, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  decoA: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.protein, opacity: 0.28, top: -80, right: -70 },
  decoB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: colors.lime, opacity: 0.18, bottom: -50, left: -40 },
  close: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  logoWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  title: { fontSize: font.h1, fontWeight: '700', color: '#fff', letterSpacing: -0.3, marginTop: 6 },
  subtitle: { fontSize: font.body, color: 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },
  body: { paddingHorizontal: SCREEN_PADDING, paddingTop: 20, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 10 },
  tileIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
  tileText: { flex: 1, fontSize: font.small, fontWeight: '500', color: colors.text },
  section: { fontSize: font.h3, fontWeight: '600', color: colors.text, marginTop: 10 },
  plansRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  table: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.border },
  headRow: { paddingVertical: 8 },
  headText: { fontSize: font.tiny, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  rowLabel: { flex: 1.5, fontSize: font.small, color: colors.text },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  cellText: { fontSize: font.tiny, color: colors.textMuted, textAlign: 'center' },
  cellPro: { color: colors.primaryDark, fontWeight: '600' },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 10 },
  promoOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  promoText: { flex: 1, fontSize: font.small, fontWeight: '500', color: colors.text },
  methods: { gap: 8 },
  method: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, padding: 12 },
  methodOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  methodText: { fontSize: font.body, fontWeight: '600', color: colors.text },
  methodHint: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },
  cardLogos: { flexDirection: 'row', gap: 4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  phoneField: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, gap: 10 },
  prefix: { fontSize: font.body, fontWeight: '600', color: colors.textMuted },
  phoneInput: { flex: 1, fontSize: font.body, color: colors.text },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  secureText: { fontSize: font.small, color: colors.textMuted },
  disclaimer: { fontSize: font.tiny, color: colors.textFaint, textAlign: 'center' },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: SCREEN_PADDING, paddingTop: 12 },
  ctaBtn: { height: 50, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '700' },
});
