import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Check, CreditCard, Landmark, Smartphone, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { PayButton } from '../components/PayButton';
import { PlanCard } from '../components/PlanCard';
import { FREE_FEATURES, PLANS, PRO_FEATURES } from '../constants/plans';
import { SCREEN_PADDING, cardBase, colors, font, radius } from '../constants/theme';
import { useSubscription } from '../hooks/useSubscription';
import { payWithCard, payWithEmola, payWithMpesa, type PaymentResult } from '../services/payments';
import type { PlanId } from '../types';

type Method = 'mpesa' | 'emola' | 'card';

function FeatureList({ items, color }: { items: string[]; color: string }) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View key={item} style={styles.feature}>
          <Check size={15} color={color} strokeWidth={3} />
          <Text style={styles.featureText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activatePlan } = useSubscription();
  const [planId, setPlanId] = useState<PlanId>('monthly');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState<Method | null>(null);

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1];

  const pay = async (method: Method) => {
    setLoading(method);
    let result: PaymentResult;
    if (method === 'mpesa') result = await payWithMpesa(plan, phone);
    else if (method === 'emola') result = await payWithEmola(plan, phone);
    else result = await payWithCard(plan);
    setLoading(null);

    if (!result.success) {
      Alert.alert('Pagamento não concluído', result.error ?? 'Tente novamente.');
      return;
    }
    try {
      await activatePlan(plan.id);
    } catch (e) {
      Alert.alert('Não foi possível ativar o plano', e instanceof Error ? e.message : 'Tente novamente.');
      return;
    }
    Alert.alert('Bem-vindo ao Nutri IA Pro', `Plano ${plan.label} ativo.\nRef.: ${result.reference} (pagamento simulado)`);
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: SCREEN_PADDING, paddingBottom: insets.bottom + 32, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.close} onPress={() => router.back()} accessibilityLabel="Fechar">
          <X size={18} color={colors.text} />
        </Pressable>

        <View style={styles.hero}>
          <Logo size={52} />
          <Text style={styles.title}>Nutri IA Pro</Text>
          <Text style={styles.subtitle}>
            Todos os planos Pro têm exatamente os mesmos recursos. Escolha apenas por quanto tempo quer pagar.
          </Text>
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} selected={p.id === planId} onPress={() => setPlanId(p.id)} />
          ))}
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Todos os planos Pro incluem</Text>
          <FeatureList items={PRO_FEATURES} color={colors.primary} />
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Plano Free · 3 dias de teste</Text>
          <FeatureList items={FREE_FEATURES} color={colors.textFaint} />
        </View>

        <Text style={styles.section}>Carteiras móveis</Text>
        <View style={styles.box}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Telemóvel (84/85 M-Pesa · 86/87 e-Mola)"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            maxLength={13}
          />
          <PayButton
            title={`Pagar via M-Pesa · ${plan.priceMT} MT`}
            backgroundColor={colors.mpesa}
            loading={loading === 'mpesa'}
            disabled={loading !== null}
            onPress={() => void pay('mpesa')}
            leading={<Smartphone size={18} color="#fff" />}
          />
          <PayButton
            title={`Pagar via e-Mola · ${plan.priceMT} MT`}
            backgroundColor={colors.emola}
            loading={loading === 'emola'}
            disabled={loading !== null}
            onPress={() => void pay('emola')}
            leading={<Smartphone size={18} color="#fff" />}
          />
        </View>

        <Text style={styles.section}>Pagamento internacional</Text>
        <View style={styles.cardBox}>
          <View style={styles.cardIcons}>
            <FontAwesome name="cc-visa" size={26} color="#fff" />
            <FontAwesome name="cc-mastercard" size={26} color="#fff" />
            <Landmark size={22} color="#fff" />
          </View>
          <PayButton
            title="Cartão Bancário / Visa / Mastercard / IBAN"
            backgroundColor={colors.navySoft}
            loading={loading === 'card'}
            disabled={loading !== null}
            onPress={() => void pay('card')}
            leading={<CreditCard size={18} color="#fff" />}
            style={styles.cardButton}
          />
          <Text style={styles.secure}>Pagamento seguro · cancele quando quiser</Text>
        </View>

        <Text style={styles.disclaimer}>MVP: os pagamentos estão simulados e nenhuma cobrança real é efetuada.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  close: { alignSelf: 'flex-end', width: 34, height: 34, borderRadius: 17, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: 6 },
  title: { fontSize: font.h1, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  plans: { gap: 16, marginTop: 6 },
  section: { fontSize: font.h3, fontWeight: '600', color: colors.text, marginTop: 8 },
  box: { ...cardBase, padding: 14, gap: 10 },
  boxTitle: { fontSize: font.h3, fontWeight: '600', color: colors.text },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { flex: 1, fontSize: font.body, color: colors.text },
  input: { height: 46, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 14, fontSize: font.body, color: colors.text },
  cardBox: { backgroundColor: colors.navy, borderRadius: radius.card, padding: 16, gap: 12 },
  cardIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardButton: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  secure: { color: 'rgba(255,255,255,0.7)', fontSize: font.small, textAlign: 'center' },
  disclaimer: { fontSize: font.tiny, color: colors.textFaint, textAlign: 'center' },
});
