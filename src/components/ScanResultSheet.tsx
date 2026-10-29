import { Flame, Leaf } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { MealPhoto } from './MealPhoto';
import { MacroGlyph, type MacroKind } from './MacroGlyph';
import { font, radius, type ThemeColors } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../hooks/useTheme';
import { mealTypeOf } from '../services/dayUtils';
import { mealScoreForGoal } from '../services/healthScore';
import type { Meal } from '../types';
import { tr } from '../i18n';

interface Props {
  meal: Meal;
  /** true quando o resultado é um exemplo (sem ligação à IA). */
  fallback: boolean;
  bottomInset: number;
  onNew: () => void;
  onDetails: () => void;
}

/** Hook: número que sobe de 0 até `to` (animação de contagem). */
function useCountUp(to: number, delay = 0, duration = 900): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = Date.now() + delay;
    const tick = () => {
      const t = Math.min(1, Math.max(0, (Date.now() - t0) / duration));
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, duration]);
  return n;
}

/** Resultado do scan: prato, calorias a subir, nota e as 3 macros com barras que enchem face à meta do dia. */
export function ScanResultSheet({ meal, fallback, bottomInset, onNew, onDetails }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { goals, profile } = useProfile();
  const a = meal.analysis;
  const score = mealScoreForGoal(a, goals, profile?.goal ?? null, mealTypeOf(meal)).score;
  const slide = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const kcal = useCountUp(a.calories, 150);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
      Animated.timing(fill, { toValue: 1, duration: 1000, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [slide, fill]);

  const verdict = score >= 7 ? 'Boa escolha' : score >= 4 ? 'Equilibrado' : 'Pesado';
  const scoreColor = score >= 7 ? { bg: '#DCFCE7', fg: '#166534' } : score >= 4 ? { bg: '#FEF3C7', fg: '#92400E' } : { bg: '#FEE2E2', fg: '#991B1B' };

  const macros: { kind: MacroKind; label: string; g: number; goal: number; color: string }[] = [
    { kind: 'protein', label: 'Proteínas', g: a.protein_g, goal: goals.proteinG, color: colors.protein },
    { kind: 'carbs', label: 'Carboidratos', g: a.carbs_g, goal: goals.carbsG, color: colors.carbs },
    { kind: 'fats', label: 'Gorduras', g: a.fats_g, goal: goals.fatsG, color: colors.fats },
  ];

  return (
    <Animated.View
      style={[
        styles.sheet,
        { paddingBottom: bottomInset + 18, opacity: slide, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] },
      ]}
    >
      <View style={styles.grabber} />

      <View style={styles.topRow}>
        <View style={styles.photoBox}>
          {meal.photoUri ? (
            <Image source={{ uri: meal.photoUri }} style={styles.photo} resizeMode="contain" />
          ) : (
            <MealPhoto name={a.food_name} style={styles.photo} emojiSize={48} />
          )}
        </View>
        <View style={styles.topInfo}>
          <Text style={styles.dish} numberOfLines={2}>
            {a.food_name}
          </Text>
          <Text style={styles.weightText}>{a.estimated_weight_grams} g</Text>
          <View style={styles.kcalRow}>
            <Flame size={22} color="#F97316" />
            <Text style={styles.kcal}>{kcal}</Text>
            <Text style={styles.kcalUnit}>kcal</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: scoreColor.bg }]}>
            <Leaf size={13} color={scoreColor.fg} />
            <Text style={[styles.chipText, { color: scoreColor.fg }]}>{tr(verdict)} · {score}/10</Text>
          </View>
        </View>
      </View>

      <View style={styles.macroRow}>
        {macros.map((m) => (
          <View key={m.kind} style={[styles.macro, { backgroundColor: `${m.color}18` }]}>
            <MacroGlyph kind={m.kind} color={m.color} size={20} />
            <Text style={[styles.macroGrams, { color: m.color }]}>{Math.round(m.g)} g</Text>
            <Text style={styles.macroLabel}>{tr(m.label)}</Text>
          </View>
        ))}
      </View>

      {fallback && <Text style={styles.metaText}>{tr('exemplo (sem ligação à IA)')}</Text>}

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={onNew}>
          <Text style={styles.btnGhostText}>{tr('Novo scan')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnPrimary, { flex: 1.4 }]} onPress={onDetails}>
          <Text style={styles.btnPrimaryText}>{tr('Ver detalhes')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, gap: 14 },
    grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
    topRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    photoBox: { width: '38%', aspectRatio: 0.8, borderRadius: 22, backgroundColor: colors.surface, overflow: 'hidden' },
    photo: { width: '100%', height: '100%' },
    topInfo: { flex: 1, gap: 6 },
    dish: { fontSize: font.h1, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    weightText: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
    kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    kcal: { fontSize: 44, lineHeight: 50, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    kcalUnit: { fontSize: font.h3, fontWeight: '600', color: colors.textMuted, marginTop: 12 },
    chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    chipText: { fontSize: font.small, fontWeight: '800' },
    macroRow: { flexDirection: 'row', gap: 10 },
    macro: { flex: 1, borderRadius: 20, paddingVertical: 14, alignItems: 'center', gap: 4 },
    macroGrams: { fontSize: font.h1, fontWeight: '800' },
    macroLabel: { fontSize: font.small, fontWeight: '600', color: colors.text },
    metaChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
    metaText: { fontSize: font.small, color: colors.textMuted, textAlign: 'center' },
    actions: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    btnGhostText: { color: colors.text, fontWeight: '700', fontSize: font.body },
    btnPrimary: { backgroundColor: colors.primary },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: font.body },
  });
