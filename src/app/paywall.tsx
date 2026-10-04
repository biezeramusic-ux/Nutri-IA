import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PayButton } from '../components/PayButton';
import { PlanCard } from '../components/PlanCard';
import { PLANS } from '../constants/plans';
import { colors, radius, shadow } from '../constants/theme';
import { useSubscription } from '../hooks/useSubscription';
import { payWithCard, payWithEmola, payWithMpesa, type PaymentResult } from '../services/payments';
import type { PlanId } from '../types';

type Method = 'mpesa' | 'emola' | 'card';

const BENEFITS = ['Scans de comida ilimitados', 'Histórico completo no diário', 'Gráficos nutricionais detalhados'];

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
    activatePlan(plan.id);
    Alert.alert('Bem-vindo ao Nutri AI Premium! 🎉', `Plano ${plan.label} ativo.\nRef.: ${result.reference} (pagamento simulado)`);
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.close} onPress={() => router.back()} accessibilityLabel="Fechar">
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="leaf" size={30} color="#fff" />
          </View>
          <Text style={styles.title}>Nutri AI Premium</Text>
          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.benefit}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} selected={p.id === planId} onPress={() => setPlanId(p.id)} />
          ))}
        </View>

        <Text style={styles.section}>Carteiras móveis</Text>
        <View style={styles.box}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Número de telemóvel (84/85 M-Pesa · 86/87 e-Mola)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            maxLength={13}
          />
          <PayButton
            title={`Pagar via M-Pesa · ${plan.priceMT} MT`}
            backgroundColor={colors.mpesa}
            loading={loading === 'mpesa'}
            disabled={loading !== null}
            onPress={() => void pay('mpesa')}
            leading={<Ionicons name="phone-portrait" size={20} color="#fff" />}
          />
          <PayButton
            title={`Pagar via e-Mola · ${plan.priceMT} MT`}
            backgroundColor={colors.emola}
            loading={loading === 'emola'}
            disabled={loading !== null}
            onPress={() => void pay('emola')}
            leading={<Ionicons name="phone-portrait" size={20} color="#fff" />}
          />
        </View>

        <Text style={styles.section}>Pagamento internacional</Text>
        <View style={styles.cardBox}>
          <View style={styles.cardIcons}>
            <FontAwesome name="cc-visa" size={30} color="#fff" />
            <FontAwesome name="cc-mastercard" size={30} color="#fff" />
            <Ionicons name="business" size={26} color="#fff" />
          </View>
          <PayButton
            title="Cartão Bancário / Visa / Mastercard / IBAN"
            backgroundColor={colors.navySoft}
            loading={loading === 'card'}
            disabled={loading !== null}
            onPress={() => void pay('card')}
            leading={<Ionicons name="card" size={22} color="#fff" />}
            style={styles.cardButton}
          />
          <Text style={styles.secure}>🔒 Pagamento seguro · cancele quando quiser</Text>
        </View>

        <Text style={styles.disclaimer}>MVP: os pagamentos estão simulados e nenhuma cobrança real é efetuada.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  close: { alignSelf: 'flex-end', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: 10 },
  logo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  benefits: { gap: 6, alignSelf: 'stretch', paddingHorizontal: 24, marginTop: 4 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  plans: { gap: 18, marginTop: 10 },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 14 },
  box: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, gap: 12, ...shadow },
  input: { height: 52, borderRadius: radius.pill, backgroundColor: colors.background, paddingHorizontal: 20, fontSize: 14, color: colors.text },
  cardBox: { backgroundColor: colors.navy, borderRadius: radius.card, padding: 18, gap: 14, ...shadow },
  cardIcons: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardButton: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  secure: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' },
  disclaimer: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
});
