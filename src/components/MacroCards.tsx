import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { MacroGlyph, type MacroKind } from './MacroGlyph';
import { font, type ThemeColors } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import type { FoodAnalysis } from '../types';
import { tr } from '../i18n';

/** Proteínas, carboidratos e gorduras do prato: gramas, e uma barra que enche até à percentagem da meta do dia. */
export function MacroCards({ analysis }: { analysis: FoodAnalysis }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { goals } = useProfile();
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, { toValue: 1, duration: 900, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fill]);

  const macros: { kind: MacroKind; label: string; g: number; goal: number; color: string }[] = [
    { kind: 'protein', label: 'Proteínas', g: analysis.protein_g, goal: goals.proteinG, color: colors.protein },
    { kind: 'carbs', label: 'Carboidratos', g: analysis.carbs_g, goal: goals.carbsG, color: colors.carbs },
    { kind: 'fats', label: 'Gorduras', g: analysis.fats_g, goal: goals.fatsG, color: colors.fats },
  ];

  return (
    <View style={styles.row}>
      {macros.map((m) => {
        const pct = Math.round((m.g / Math.max(1, m.goal)) * 100);
        return (
          <View key={m.kind} style={styles.card}>
            <View style={[styles.icon, { backgroundColor: `${m.color}22` }]}>
              <MacroGlyph kind={m.kind} color={m.color} size={18} />
            </View>
            <Text style={styles.grams}>
              {Math.round(m.g)}
              <Text style={styles.unit}> g</Text>
            </Text>
            <Text style={styles.label}>{tr(m.label)}</Text>
            <View style={styles.track}>
              <Animated.View
                style={[styles.bar, { backgroundColor: m.color, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.max(6, Math.min(100, pct))}%`] }) }]}
              />
            </View>
            <Text style={styles.pct}>{pct}% {tr('da meta')}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    card: { flex: 1, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 3 },
    icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    grams: { fontSize: font.h1, fontWeight: '800', color: colors.text },
    unit: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
    label: { fontSize: font.small, fontWeight: '600', color: colors.text },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden', marginTop: 4 },
    bar: { height: 6, borderRadius: 3 },
    pct: { fontSize: font.tiny, color: colors.textMuted },
  });
