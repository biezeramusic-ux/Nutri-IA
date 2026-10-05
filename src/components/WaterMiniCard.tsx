import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';

interface Props {
  glasses: number;
  goalGlasses: number;
  onAdd: () => void;
  onOpen: () => void;
}

export function WaterMiniCard({ glasses, goalGlasses, onAdd, onOpen }: Props) {
  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Beber água</Text>
        <View style={styles.icon}>
          <Ionicons name="water" size={20} color={colors.water} />
        </View>
      </View>
      <View style={styles.row}>
        <View>
          <Text style={styles.value}>
            {glasses}
            <Text style={styles.of}> / {goalGlasses}</Text>
          </Text>
          <Text style={styles.sub}>copos hoje</Text>
        </View>
        <Pressable style={styles.add} onPress={onAdd} hitSlop={8} accessibilityLabel="Adicionar um copo">
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, gap: 10, ...shadow },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.waterSoft, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  value: { fontSize: 26, fontWeight: '800', color: colors.text },
  of: { fontSize: 15, color: colors.textMuted, fontWeight: '700' },
  sub: { fontSize: 11, color: colors.textMuted },
  add: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.water, alignItems: 'center', justifyContent: 'center' },
});
