import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, colors, font, radius } from '../constants/theme';
import type { Plan } from '../types';

interface Props {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
}

export function PlanCard({ plan, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      {plan.badge && (
        <View style={[styles.badge, plan.badge === 'Melhor Valor' && styles.badgeAlt]}>
          <Text style={styles.badgeText}>{plan.badge}</Text>
        </View>
      )}
      <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Check size={14} color="#fff" strokeWidth={3} />}</View>
      <View style={styles.info}>
        <Text style={styles.label}>{plan.label}</Text>
        <Text style={styles.sub}>Análises ilimitadas</Text>
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>{plan.priceMT} MT</Text>
        <Text style={styles.period}>{plan.period}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { ...cardBase, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, padding: 14, borderWidth: 1.5 },
  selected: { borderColor: colors.primary, backgroundColor: '#F6FBF6' },
  badge: { position: 'absolute', top: -10, right: 14, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeAlt: { backgroundColor: colors.navy },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  info: { flex: 1 },
  label: { fontSize: font.h3, fontWeight: '600', color: colors.text },
  sub: { fontSize: font.small, color: colors.textMuted, marginTop: 1 },
  priceCol: { alignItems: 'flex-end' },
  price: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  period: { fontSize: font.tiny, color: colors.textMuted },
});
