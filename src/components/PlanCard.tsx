import { tr } from '../i18n';
import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { font, formatMT, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { Plan } from '../types';

interface Props {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
  /** Desconto em % (ex.: 5 pelos convites). */
  discountPct?: number;
}

const WEEKLY_PRICE = 50;

/** Preço com desconto (arredondado ao metical). */
export const discountedPrice = (price: number, pct: number): number => Math.round(price * (1 - pct / 100));

/** Preço por mês e poupança face ao plano semanal (só informativo). */
function priceInfo(plan: Plan): { perMonth: number; savePct: number } {
  const perMonth = Math.round((plan.priceMT / plan.days) * 30);
  const weeklyPerMonth = (WEEKLY_PRICE / 7) * 30;
  const savePct = plan.days > 7 ? Math.round((1 - perMonth / weeklyPerMonth) * 100) : 0;
  return { perMonth, savePct };
}

/** Cartão de plano em coluna: três cabem lado a lado no ecrã do telemóvel. */
export function PlanCard({ plan, selected, onPress, discountPct = 0 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const finalPrice = discountedPrice(plan.priceMT, discountPct);
  const { perMonth, savePct } = priceInfo({ ...plan, priceMT: finalPrice });
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]} accessibilityRole="button">
      {plan.badge && (
        <View style={[styles.badge, plan.badge === 'Melhor Valor' && styles.badgeAlt]}>
          <Text style={[styles.badgeText, plan.badge === 'Melhor Valor' && { color: '#fff' }]} numberOfLines={1}>
            {plan.badge}
          </Text>
        </View>
      )}
      <Text style={styles.label}>{plan.label}</Text>
      {discountPct > 0 && <Text style={styles.old}>{formatMT(plan.priceMT)}</Text>}
      <Text style={styles.price}>{formatMT(finalPrice)}</Text>
      <Text style={styles.currency}>MT {plan.period}</Text>
      <Text style={styles.sub}>{plan.days > 7 ? tr('≈ {n} MT/mês', { n: perMonth }) : 'Sem compromisso'}</Text>
      <View style={[styles.save, savePct === 0 && { opacity: 0 }]}>
        <Text style={styles.saveText}>-{savePct}%</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Check size={12} color="#fff" strokeWidth={3.5} />}</View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { flex: 1, alignItems: 'center', gap: 2, backgroundColor: colors.card, borderRadius: radius.lg, paddingTop: 20, paddingBottom: 12, paddingHorizontal: 6, borderWidth: 1.5, borderColor: colors.border },
    selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    badge: { position: 'absolute', top: -10, backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
    badgeAlt: { backgroundColor: colors.primaryDark === '#7BD87F' ? '#2E7D32' : colors.primaryDark },
    badgeText: { color: '#0F172A', fontSize: 9, fontWeight: '800' },
    label: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
    old: { fontSize: font.tiny, color: colors.textFaint, textDecorationLine: 'line-through', marginBottom: -2 },
    price: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    currency: { fontSize: font.tiny, color: colors.textMuted },
    sub: { fontSize: 10, color: colors.textFaint, marginTop: 4 },
    save: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 1, marginTop: 4 },
    saveText: { fontSize: 10, fontWeight: '800', color: colors.primaryDark },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  });
