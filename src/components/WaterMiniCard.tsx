import { useMemo } from 'react';
import { Droplets, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  glasses: number;
  goalGlasses: number;
  onAdd: () => void;
  onOpen: () => void;
}

export function WaterMiniCard({ glasses, goalGlasses, onAdd, onOpen }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Água</Text>
        <View style={styles.icon}>
          <Droplets size={16} color={colors.water} />
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
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: { ...cardBase(colors), padding: 14, gap: 10, flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: font.body, fontWeight: '600', color: colors.text },
  icon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.waterSoft, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  value: { fontSize: 24, fontWeight: '700', color: colors.text },
  of: { fontSize: font.body, color: colors.textMuted, fontWeight: '500' },
  sub: { fontSize: font.tiny, color: colors.textMuted },
  add: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.water, alignItems: 'center', justifyContent: 'center' },
});
