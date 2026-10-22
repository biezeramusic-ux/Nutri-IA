import { Flame, Leaf, ShieldCheck } from 'lucide-react-native';
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

      <View style={styles.titleRow}>
        <Text style={styles.dish} numberOfLines={2}>
          {a.food_name}
        </Text>
        <View style={styles.weight}>
          <Text style={styles.weightText}>{a.estimated_weight_grams} g</Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.photoBox}>
          {meal.photoUri ? (
            <Image source={{ uri: meal.photoUri }} style={styles.photo} resizeMode="contain" />
          ) : (
            <MealPhoto name={a.food_name} style={styles.photo} emojiSize={48} />
          )}
        </View>
        <View style={styles.side}>
          <View style={styles.kcalRow}>
            <Flame size={20} color="#F97316" />
            <Text style={styles.kcal}>{kcal}</Text>
            <Text style={styles.kcalUnit}>kcal</Text>
            <View style={{ flex: 1 }} />
            <View style={[styles.chip, { backgroundColor: scoreColor.bg }]}>
              <Leaf size={12} color={scoreColor.fg} />
              <Text style={[styles.chipText, { color: scoreColor.fg }]}>{score}/10</Text>
            </View>
          </View>
          {macros.map((m) => {
            const pct = Math.round((m.g / Math.max(1, m.goal)) * 100);
            return (
              <View key={m.kind} style={styles.macroLine}>
                <View style={[styles.macroIcon, { backgroundColor: `${m.color}22` }]}>
                  <MacroGlyph kind={m.kind} color={m.color} size={15} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.macroTop}>
                    <Text style={styles.macroLabel}>{tr(m.label)}</Text>
                    <Text style={styles.macroGrams}>
                      {Math.round(m.g)}
                      <Text style={styles.macroUnit}> g</Text>
                    </Text>
                  </View>
                  <View style={styles.track}>
                    <Animated.View
                      style={[
                        styles.fillBar,
                        { backgroundColor: m.color, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.max(6, Math.min(100, pct))}%`] }) },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.metaRow}>
        {typeof a.confidence === 'number' && !fallback && (
          <View style={styles.metaChip}>
            <ShieldCheck size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{a.confidence}% {tr('de certeza')}</Text>
          </View>
        )}
        {fallback && <Text style={styles.metaText}>{tr('exemplo (sem ligação à IA)')}</Text>}
      </View>

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
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dish: { flex: 1, fontSize: font.h1, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    weight: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    weightText: { fontSize: font.small, fontWeight: '700', color: colors.textMuted },
    kcalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    flame: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
    kcal: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    kcalUnit: { fontSize: font.h3, fontWeight: '600', color: colors.textMuted, marginTop: 10 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
    chipText: { fontSize: font.body, fontWeight: '800' },
    bodyRow: { flexDirection: 'row', gap: 14, alignItems: 'stretch' },
    photoBox: { width: '38%', minHeight: 170, borderRadius: 20, backgroundColor: colors.surface, overflow: 'hidden' },
    photo: { width: '100%', height: '100%', minHeight: 170 },
    side: { flex: 1, gap: 10, justifyContent: 'center' },
    macroLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    macro: { flex: 1, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 3 },
    macroIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    macroGrams: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    macroUnit: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
    macroLabel: { fontSize: font.small, fontWeight: '600', color: colors.text },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: 'hidden', marginTop: 4 },
    fillBar: { height: 6, borderRadius: 3 },
    macroPct: { fontSize: font.tiny, color: colors.textMuted },
    metaRow: { flexDirection: 'row', justifyContent: 'center', minHeight: 16 },
    metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: font.small, color: colors.textMuted },
    actions: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    btnGhostText: { color: colors.text, fontWeight: '700', fontSize: font.body },
    btnPrimary: { backgroundColor: colors.primary },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: font.body },
  });
