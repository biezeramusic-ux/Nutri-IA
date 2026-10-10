import { Check, Lock, ShieldCheck } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, formatMT, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import type { Plan } from '../types';
import { Text } from './AppText';
import { PaymentLogo } from './PaymentLogos';

export type PayMethod = 'mpesa' | 'emola' | 'card';

export interface PayOutcome {
  ok: boolean;
  reference?: string;
  error?: string;
}

interface Props {
  visible: boolean;
  plan: Plan;
  /** Preço antes do desconto (para mostrar riscado), se houver. */
  originalPrice?: number;
  isExtending: boolean;
  onClose: () => void;
  /** Faz o pagamento e ativa o plano. */
  onPay: (method: PayMethod, phone: string) => Promise<PayOutcome>;
  /** Chamado ao carregar em "Concluir" depois de pagar. */
  onDone: () => void;
}

const METHODS: { id: PayMethod; label: string; hint: string }[] = [
  { id: 'mpesa', label: 'M-Pesa', hint: 'Vodacom · 84 / 85' },
  { id: 'emola', label: 'e-Mola', hint: 'Movitel · 86 / 87' },
  { id: 'card', label: 'Cartão bancário', hint: 'Visa, Mastercard, IBAN' },
];

const native = Platform.OS !== 'web';

/** Painel de pagamento que sobe de baixo; arrasta-se pela barra do topo para fechar. */
export function PaymentSheet({ visible, plan, originalPrice, isExtending, onClose, onPay, onDone }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const y = useRef(new Animated.Value(height)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [method, setMethod] = useState<PayMethod>('mpesa');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'form' | 'processing' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const busy = useRef(false);

  const animateClose = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(y, { toValue: height, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: native }),
      Animated.timing(fade, { toValue: 0, duration: 240, useNativeDriver: native }),
    ]).start(() => {
      setMounted(false);
      after?.();
    });
  };
  const requestClose = () => {
    if (busy.current) return;
    animateClose(onClose);
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setState('form');
      setError(null);
      y.setValue(height);
      Animated.parallel([
        Animated.timing(y, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: native }),
      ]).start();
    } else if (mounted) {
      animateClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) y.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 0.9) requestClose();
        else Animated.spring(y, { toValue: 0, useNativeDriver: native, bounciness: 6 }).start();
      },
    }),
  ).current;

  const confirm = async () => {
    setError(null);
    busy.current = true;
    setState('processing');
    const result = await onPay(method, phone);
    busy.current = false;
    if (result.ok) {
      setReference(result.reference ?? '');
      setState('success');
    } else {
      setState('form');
      setError(result.error ?? 'Tente novamente.');
    }
  };

  if (!mounted) return null;

  const perMonth = Math.round((plan.priceMT / plan.days) * 30);

  return (
    <Modal transparent visible animationType="none" onRequestClose={requestClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel={tr('Fechar')} />
        </Animated.View>
        <KeyboardAvoidingView behavior="padding" style={styles.kav} pointerEvents="box-none">
          <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: y }] }]}>
            <View {...pan.panHandlers} style={styles.grabArea}>
              <View style={styles.grab} />
            </View>

            {state === 'success' ? (
              <View style={styles.success}>
                <View style={styles.okCircle}>
                  <Check size={34} color="#fff" strokeWidth={3} />
                </View>
                <Text style={styles.okTitle}>{tr('Plano ativo')}</Text>
                <Text style={styles.okSub}>{tr('Bem-vindo ao Nutri IA Pro 👑')}</Text>
                <View style={styles.okCard}>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>{tr('Plano')}</Text>
                    <Text style={styles.sumValue}>{tr(plan.label)}</Text>
                  </View>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>{tr('Duração')}</Text>
                    <Text style={styles.sumValue}>{tr('{n} dias', { n: plan.days })}</Text>
                  </View>
                  <View style={styles.sumRow}>
                    <Text style={styles.sumLabel}>{tr('Valor')}</Text>
                    <Text style={styles.sumValue}>{formatMT(plan.priceMT)} MT</Text>
                  </View>
                  {!!reference && (
                    <View style={styles.sumRow}>
                      <Text style={styles.sumLabel}>{tr('Referência')}</Text>
                      <Text style={styles.sumValue}>{reference}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sim}>{tr('(pagamento simulado)')}</Text>
                <Pressable style={styles.cta} onPress={() => animateClose(onDone)}>
                  <Text style={styles.ctaText}>{tr('Concluir')}</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.title}>{tr('Pagamento')}</Text>

                <View style={styles.summary}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>
                      Nutri IA Pro · {tr(plan.label)}
                    </Text>
                    <Text style={styles.planSub}>{plan.days > 7 ? tr('≈ {n} MT/mês', { n: perMonth }) : tr('Sem compromisso')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {originalPrice !== undefined && originalPrice !== plan.priceMT && <Text style={styles.old}>{formatMT(originalPrice)} MT</Text>}
                    <Text style={styles.price}>{formatMT(plan.priceMT)} MT</Text>
                    <Text style={styles.period}>{tr(plan.period)}</Text>
                  </View>
                </View>

                <Text style={styles.section}>{tr('Como quer pagar?')}</Text>
                <View style={{ gap: 8 }}>
                  {METHODS.map((m) => {
                    const on = method === m.id;
                    return (
                      <Pressable key={m.id} disabled={state === 'processing'} onPress={() => setMethod(m.id)} style={[styles.method, on && styles.methodOn]}>
                        {m.id === 'card' ? (
                          <View style={{ flexDirection: 'row', gap: 4 }}>
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
                      editable={state !== 'processing'}
                    />
                  </View>
                )}

                {!!error && <Text style={styles.error}>{tr(error)}</Text>}

                <Pressable disabled={state === 'processing'} style={({ pressed }) => [styles.cta, (pressed || state === 'processing') && { opacity: 0.85 }]} onPress={() => void confirm()}>
                  {state === 'processing' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Lock size={16} color="#fff" />
                      <Text style={styles.ctaText}>
                        {tr(isExtending ? 'Prolongar por' : 'Pagar')} {formatMT(plan.priceMT)} MT
                      </Text>
                    </View>
                  )}
                </Pressable>
                <View style={styles.secure}>
                  <ShieldCheck size={14} color={colors.textMuted} />
                  <Text style={styles.secureText}>{tr('Pagamento seguro · cancele quando quiser')}</Text>
                </View>
                <Text style={styles.disclaimer}>{tr('MVP: os pagamentos estão simulados e nenhuma cobrança real é efetuada.')}</Text>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
    kav: { justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, gap: 12 },
    grabArea: { alignItems: 'center', paddingTop: 10, paddingBottom: 6, marginHorizontal: -20 },
    grab: { width: 46, height: 5, borderRadius: 3, backgroundColor: colors.border },
    title: { fontSize: font.h1, fontWeight: '800', color: colors.text },
    summary: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14 },
    planName: { fontSize: font.h3, fontWeight: '700', color: colors.text },
    planSub: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
    old: { fontSize: font.tiny, color: colors.textFaint, textDecorationLine: 'line-through' },
    price: { fontSize: font.h2, fontWeight: '800', color: colors.text },
    period: { fontSize: font.tiny, color: colors.textMuted },
    section: { fontSize: font.small, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
    method: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, padding: 12 },
    methodOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    methodText: { fontSize: font.body, fontWeight: '600', color: colors.text },
    methodHint: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    phoneField: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, gap: 10 },
    prefix: { fontSize: font.body, fontWeight: '600', color: colors.textMuted },
    phoneInput: { flex: 1, fontSize: font.body, color: colors.text },
    error: { fontSize: font.small, color: colors.danger, textAlign: 'center' },
    cta: { height: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    ctaText: { color: '#fff', fontSize: font.h3, fontWeight: '800' },
    secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    secureText: { fontSize: font.small, color: colors.textMuted },
    disclaimer: { fontSize: font.tiny, color: colors.textFaint, textAlign: 'center' },
    success: { alignItems: 'center', gap: 10, paddingTop: 6 },
    okCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    okTitle: { fontSize: font.h1, fontWeight: '800', color: colors.text },
    okSub: { fontSize: font.body, color: colors.textMuted },
    okCard: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10, marginTop: 4 },
    sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    sumLabel: { fontSize: font.body, color: colors.textMuted },
    sumValue: { fontSize: font.body, fontWeight: '700', color: colors.text, flexShrink: 1, textAlign: 'right' },
    sim: { fontSize: font.tiny, color: colors.textFaint },
  });
