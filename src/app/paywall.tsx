import { useRouter } from 'expo-router';
import { Activity, Check, CreditCard, Droplets, Infinity as InfinityIcon, Leaf, Minus, ShieldCheck, Smartphone, TrendingUp, UtensilsCrossed, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { PlanCard } from '../components/PlanCard';
import { PLANS } from '../constants/plans';
import { SCREEN_PADDING, colors, font, radius } from '../constants/theme';
import { useSubscription } from '../hooks/useSubscription';
import { payWithCard, payWithEmola, payWithMpesa, type PaymentResult } from '../services/payments';
import type { PlanId } from '../types';

type Method = 'mpesa' | 'emola' | 'card';

const HIGHLIGHTS = [
  { icon: InfinityIcon, text: 'Análises e registos ilimitados' },
  { icon: Leaf, text: 'Fibras e análise detalhada' },
  { icon: TrendingUp, text: 'Progresso e objetivos' },
  { icon: Droplets, text: 'Registo de água' },
  { icon: Activity, text: 'Atividade física' },
  { icon: UtensilsCrossed, text: 'Pratos moçambicanos' },
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

const METHODS: { id: Method; label: string }[] = [
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'emola', label: 'e-Mola' },
  { id: 'card', label: 'Cartão' },
];

function Cell({ value, pro }: { value: string | boolean; pro?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? <Check size={16} color={pro ? colors.primaryDark : colors.textFaint} strokeWidth={3} /> : <Minus size={16} color={colors.textFaint} />;
  }
  return <Text style={[styles.cellText, pro && styles.cellPro]}>{value}</Text>;
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activatePlan } = useSubscription();
  const [planId, setPlanId] = useState<PlanId>('monthly');
  const [method, setMethod] = useState<Method>('mpesa');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1];

  const pay = async () => {
    setLoading(true);
    let result: PaymentResult;
    if (method === 'mpesa') result = await payWithMpesa(plan, phone);
    else if (method === 'emola') result = await payWithEmola(plan, phone);
    else result = await payWithCard(plan);
    if (!result.success) {
      setLoading(false);
      Alert.alert('Pagamento não concluído', result.error ?? 'Tente novamente.');
      return;
    }
    try {
      await activatePlan(plan.id);
    } catch (e) {
      setLoading(false);
      Alert.alert('Não foi possível ativar o plano', e instanceof Error ? e.message : 'Tente novamente.');
      return;
    }
    setLoading(false);
    Alert.alert('Bem-vindo ao Nutri IA Pro', `Plano ${plan.label} ativo.\nRef.: ${result.reference} (pagamento simulado)`);
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
          <Pressable style={styles.close} onPress={() => router.back()} accessibilityLabel="Fechar">
            <X size={18} color="#fff" />
          </Pressable>
          <View style={styles.logoWrap}>
            <Logo size={44} />
          </View>
          <Text style={styles.title}>Nutri IA Pro</Text>
          <Text style={styles.subtitle}>Coma melhor, sem adivinhar. Todos os planos têm os mesmos recursos.</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.grid}>
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <View key={text} style={styles.tile}>
                <View style={styles.tileIcon}>
                  <Icon size={16} color={colors.primaryDark} />
                </View>
                <Text style={styles.tileText}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.section}>Escolha o seu plano</Text>
          <View style={styles.plans}>
            {PLANS.map((p) => (
              <PlanCard key={p.id} plan={p} selected={p.id === planId} onPress={() => setPlanId(p.id)} />
            ))}
          </View>

          <Text style={styles.section}>Grátis vs Pro</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.headRow]}>
              <Text style={[styles.rowLabel, styles.headText]} />
              <Text style={[styles.col, styles.headText]}>Grátis</Text>
              <Text style={[styles.col, styles.headText, styles.cellPro]}>Pro</Text>
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

          <Text style={styles.section}>Como quer pagar?</Text>
          <View style={styles.methods}>
            {METHODS.map((m) => (
              <Pressable key={m.id} onPress={() => setMethod(m.id)} style={[styles.method, method === m.id && styles.methodOn]}>
                <Text style={[styles.methodText, method === m.id && styles.methodTextOn]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          {method !== 'card' ? (
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder={method === 'mpesa' ? 'Número M-Pesa (84 / 85)' : 'Número e-Mola (86 / 87)'}
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              maxLength={13}
            />
          ) : (
            <Text style={styles.hint}>Cartão bancário, Visa, Mastercard ou IBAN.</Text>
          )}

          <View style={styles.secure}>
            <ShieldCheck size={14} color={colors.textMuted} />
            <Text style={styles.secureText}>Pagamento seguro · cancele quando quiser</Text>
          </View>
          <Text style={styles.disclaimer}>MVP: os pagamentos estão simulados e nenhuma cobrança real é efetuada.</Text>
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={() => void pay()} disabled={loading} style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.ctaRow}>
              {method === 'card' ? <CreditCard size={18} color="#fff" /> : <Smartphone size={18} color="#fff" />}
              <Text style={styles.ctaText}>
                Continuar · {plan.priceMT.toLocaleString('pt-PT')} MT {plan.period}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: '#14532D', paddingHorizontal: SCREEN_PADDING, paddingBottom: 30, alignItems: 'center', gap: 6, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  decoA: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.primary, opacity: 0.25, top: -80, right: -70 },
  decoB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: colors.lime, opacity: 0.18, bottom: -50, left: -40 },
  close: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  logoWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  title: { fontSize: font.h1, fontWeight: '700', color: '#fff', letterSpacing: -0.3, marginTop: 6 },
  subtitle: { fontSize: font.body, color: 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },
  body: { paddingHorizontal: SCREEN_PADDING, paddingTop: 20, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 10 },
  tileIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  tileText: { flex: 1, fontSize: font.small, fontWeight: '500', color: colors.text },
  section: { fontSize: font.h3, fontWeight: '600', color: colors.text, marginTop: 10 },
  plans: { gap: 14, marginTop: 2 },
  table: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.border },
  headRow: { paddingVertical: 8 },
  headText: { fontSize: font.tiny, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  rowLabel: { flex: 1.5, fontSize: font.small, color: colors.text },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  cellText: { fontSize: font.tiny, color: colors.textMuted, textAlign: 'center' },
  cellPro: { color: colors.primaryDark, fontWeight: '600' },
  methods: { flexDirection: 'row', gap: 8 },
  method: { flex: 1, height: 40, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  methodOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  methodText: { fontSize: font.body, fontWeight: '500', color: colors.textMuted },
  methodTextOn: { color: colors.primaryDark, fontWeight: '700' },
  input: { height: 46, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, fontSize: font.body, color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  secureText: { fontSize: font.small, color: colors.textMuted },
  disclaimer: { fontSize: font.tiny, color: colors.textFaint, textAlign: 'center' },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: SCREEN_PADDING, paddingTop: 12 },
  ctaBtn: { height: 50, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '700' },
});
