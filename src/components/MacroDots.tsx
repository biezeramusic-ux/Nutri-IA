import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import type { MacroPercentages } from '../types';
import { MacroGlyph } from './MacroGlyph';

export function MacroDots({ macros }: { macros: MacroPercentages }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const items = [
    { key: 'carbs' as const, value: macros.carbs, color: colors.carbs },
    { key: 'protein' as const, value: macros.protein, color: colors.protein },
    { key: 'fats' as const, value: macros.fats, color: colors.fats },
  ];
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <MacroGlyph kind={item.key} color={item.color} size={13} />
          <Text style={styles.text}>{item.value}%</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: font.tiny, color: colors.textMuted, fontWeight: '600' },
});
