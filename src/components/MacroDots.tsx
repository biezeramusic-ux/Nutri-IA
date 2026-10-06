import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../constants/theme';
import type { MacroPercentages } from '../types';

export function MacroDots({ macros }: { macros: MacroPercentages }) {
  const items = [
    { key: 'C', value: macros.carbs, color: colors.carbs },
    { key: 'P', value: macros.protein, color: colors.protein },
    { key: 'G', value: macros.fats, color: colors.fats },
  ];
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.text}>
            {item.key} {item.value}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: font.tiny, color: colors.textMuted, fontWeight: '600' },
});
