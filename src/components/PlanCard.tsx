import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';
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
      <View style={styles.radio}>
        {selected && <Ionicons name="checkmark" size={16} color="#fff" style={styles.check} />}
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>{plan.label}</Text>
        <Text style={styles.sub}>Scans ilimitados</Text>
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>{plan.priceMT} MT</Text>
        <Text style={styles.period}>{plan.period}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#F4FBF4' },
  badge: {
    position: 'absolute',
    top: -11,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeAlt: { backgroundColor: colors.navy },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { backgroundColor: colors.primary, borderRadius: 12, width: 24, height: 24, textAlign: 'center', lineHeight: 24 },
  info: { flex: 1 },
  label: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  priceCol: { alignItems: 'flex-end' },
  price: { fontSize: 20, fontWeight: '800', color: colors.text },
  period: { fontSize: 11, color: colors.textMuted },
});
