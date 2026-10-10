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
  const badgeAlt = plan.badge === 'Melhor Valor';
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]} accessibilityRole="button">
      <View style={styles.badgeSlot}>
        {plan.badge && (
          <View style={[styles.badge, badgeAlt && styles.badgeAlt]}>
            <Text style={[styles.badgeText, badgeAlt && { color: '#fff' }]} numberOfLines={1}>
              {plan.badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>{plan.label}</Text>
      <View style={styles.priceBlock}>
        <Text style={[styles.old, discountPct === 0 && { opacity: 0 }]}>{formatMT(plan.priceMT)}</Text>
        <Text style={styles.price} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {formatMT(finalPrice)}
        </Text>
        <Text style={styles.currency}>MT {plan.period}</Text>
      </View>
      <Text style={styles.sub}>{tr('≈ {n} MT/mês', { n: perMonth })}</Text>
      <View style={[styles.save, savePct === 0 && styles.saveNeutral]}>
        <Text style={[styles.saveText, savePct === 0 && { color: colors.textMuted }]}>{savePct > 0 ? `-${savePct}%` : tr('Flexível')}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Check size={12} color="#fff" strokeWidth={3.5} />}</View>
    </Pressable>
  );
}

const BLUE = '#2F5BEA';

const createStyles = (colors: ThemeColors) => {
  const soft = colors.background === '#000000' ? '#10192E' : '#EEF3FF';
  return StyleSheet.create({
    card: { flex: 1, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, paddingTop: 8, paddingBottom: 14, paddingHorizontal: 6, borderWidth: 1.5, borderColor: colors.border },
    selected: { borderColor: BLUE, backgroundColor: soft },
    badgeSlot: { height: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
    badge: { backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
    badgeAlt: { backgroundColor: BLUE },
    badgeText: { color: '#0F172A', fontSize: 9, fontWeight: '800' },
    label: { fontSize: font.small, fontWeight: '700', color: colors.textMuted, marginTop: 6 },
    priceBlock: { alignItems: 'center', marginTop: 4 },
    old: { fontSize: font.tiny, color: colors.textFaint, textDecorationLine: 'line-through', height: 14 },
    price: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    currency: { fontSize: font.tiny, color: colors.textMuted },
    sub: { fontSize: 10, color: colors.textFaint, marginTop: 6 },
    save: { backgroundColor: soft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
    saveNeutral: { backgroundColor: colors.background === '#000000' ? '#1A1A1A' : '#F1F5F9' },
    saveText: { fontSize: 10, fontWeight: '800', color: BLUE },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    radioOn: { backgroundColor: BLUE, borderColor: BLUE },
  });
};
