import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '../constants/theme';
import type { Plan } from '../types';

interface Props {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
}

const WEEKLY_PRICE = 50;

/** Preço por mês e poupança face ao plano semanal (só informativo). */
function priceInfo(plan: Plan): { perMonth: number; savePct: number } {
  const perMonth = Math.round((plan.priceMT / plan.days) * 30);
  const weeklyPerMonth = (WEEKLY_PRICE / 7) * 30;
  const savePct = plan.days > 7 ? Math.round((1 - perMonth / weeklyPerMonth) * 100) : 0;
  return { perMonth, savePct };
}

export function PlanCard({ plan, selected, onPress }: Props) {
  const { perMonth, savePct } = priceInfo(plan);
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      {plan.badge && (
        <View style={[styles.badge, plan.badge === 'Melhor Valor' && styles.badgeAlt]}>
          <Text style={[styles.badgeText, plan.badge === 'Melhor Valor' && { color: '#fff' }]}>{plan.badge}</Text>
        </View>
      )}
      <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Check size={13} color="#fff" strokeWidth={3} />}</View>
      <View style={styles.info}>
        <Text style={styles.label}>{plan.label}</Text>
        <Text style={styles.sub}>
          {plan.days > 7 ? `≈ ${perMonth} MT / mês` : 'Sem compromisso'}
          {savePct > 0 ? `  ·  poupa ${savePct}%` : ''}
        </Text>
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>{plan.priceMT.toLocaleString('pt-PT')} MT</Text>
        <Text style={styles.period}>{plan.period}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: colors.border },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  badge: { position: 'absolute', top: -9, right: 14, backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2 },
  badgeAlt: { backgroundColor: colors.primaryDark },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  info: { flex: 1 },
  label: { fontSize: font.h3, fontWeight: '600', color: colors.text },
  sub: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  priceCol: { alignItems: 'flex-end' },
  price: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  period: { fontSize: font.tiny, color: colors.textMuted },
});
