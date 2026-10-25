import { Minus, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';
import type { Sex } from '../../types';
import { BodyFigure, lifeStage } from './BodyFigure';
import { DragSlider } from './DragSlider';

const STAGE_LABEL = { child: 'Criança', teen: 'Adolescente', adult: 'Adulto', senior: 'Sénior' } as const;

function Big({ value, unit, onMinus, onPlus, colors }: { value: string | number; unit: string; onMinus: () => void; onPlus: () => void; colors: ThemeColors }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.bigRow}>
      <Pressable style={styles.round} onPress={onMinus} hitSlop={8}>
        <Minus size={22} color={colors.primary} strokeWidth={3} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={styles.bigValue}>{value}</Text>
        <Text style={styles.bigUnit}>{unit}</Text>
      </View>
      <Pressable style={[styles.round, styles.roundOn]} onPress={onPlus} hitSlop={8}>
        <Plus size={22} color="#fff" strokeWidth={3} />
      </Pressable>
    </View>
  );
}

/** Ecrã do sexo: dois cartões grandes com o desenho de cada um. */
export function SexStep({ sex, onChange, age }: { sex: Sex; onChange: (s: Sex) => void; age: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pick = (s: Sex, label: string, tint: string) => (
    <Pressable key={s} onPress={() => onChange(s)} style={[styles.sexCard, sex === s && styles.sexOn]}>
      <BodyFigure sex={s} age={age} h={230} color={sex === s ? colors.primary : tint} />
      <Text style={[styles.sexLabel, sex === s && { color: colors.primary }]}>{tr(label)}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
      {pick('female', 'Mulher', '#F9A8D4')}
      {pick('male', 'Homem', '#93C5FD')}
    </View>
  );
}

/** Ecrã da idade: o boneco muda de fase (criança, adolescente, adulto, sénior) à medida que arrasta. */
export function AgeStep({ sex, age, onChange, width }: { sex: Sex; age: number; onChange: (v: number) => void; width: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const stage = lifeStage(age);
  const figH = stage === 'child' ? 150 : stage === 'teen' ? 190 : 230;
  return (
    <View style={styles.panel}>
      <View style={{ height: 250, justifyContent: 'flex-end', alignItems: 'center' }}>
        <BodyFigure sex={sex} age={age} h={figH} color={colors.primary} />
        <View style={styles.ground} />
      </View>
      <View style={styles.stageChip}>
        <Text style={styles.stageText}>{tr(STAGE_LABEL[stage])}</Text>
      </View>
      <Big value={age} unit={tr('anos')} colors={colors} onMinus={() => onChange(Math.max(10, age - 1))} onPlus={() => onChange(Math.min(100, age + 1))} />
      <DragSlider value={age} min={10} max={100} length={width - 64} onChange={onChange} />
    </View>
  );
}

/** Peso (e peso desejado, se houver) com barra de arrastar e botões. */
export function WeightStep({ kg, target, wantsTarget, onKg, onTarget, width }: { kg: number; target: number; wantsTarget: boolean; onKg: (v: number) => void; onTarget: (v: number) => void; width: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const len = width - 64;
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.panel}>
        <Text style={styles.cardLabel}>{tr('Peso atual')}</Text>
        <Big value={kg} unit="kg" colors={colors} onMinus={() => onKg(Math.max(30, kg - 1))} onPlus={() => onKg(Math.min(200, kg + 1))} />
        <DragSlider value={kg} min={30} max={200} length={len} onChange={onKg} />
      </View>
      {wantsTarget && (
        <View style={styles.panel}>
          <Text style={styles.cardLabel}>{tr('Peso desejado')}</Text>
          <Big value={target} unit="kg" colors={colors} onMinus={() => onTarget(Math.max(30, target - 1))} onPlus={() => onTarget(Math.min(200, target + 1))} />
          <DragSlider value={target} min={30} max={200} length={len} onChange={onTarget} />
        </View>
      )}
    </View>
  );
}

/** Ponto de partida: IMC numa barra colorida e a faixa de peso saudável para a sua altura. */
export function BmiStep({ weightKg, heightCm, goals, width }: { weightKg: number; heightCm: number; goals: string[]; width: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  const lo = Math.round(18.5 * m * m);
  const hi = Math.round(24.9 * m * m);
  const cat = bmi < 18.5 ? 'Abaixo do peso' : bmi < 25 ? 'Peso saudável' : bmi < 30 ? 'Excesso de peso' : 'Obesidade';
  const frac = Math.max(0.02, Math.min(0.98, (bmi - 14) / (40 - 14)));
  const barW = width - 64;
  const segs = [
    { c: '#60A5FA', w: (18.5 - 14) / 26 },
    { c: '#4CAF50', w: (25 - 18.5) / 26 },
    { c: '#FBBF24', w: 5 / 26 },
    { c: '#F87171', w: 10 / 26 },
  ];
  return (
    <View style={styles.panel}>
      <Text style={styles.cardLabel}>{tr('O seu IMC')}</Text>
      <Text style={styles.bmi}>{bmi.toFixed(1).replace('.', ',')}</Text>
      <View style={styles.bmiChip}>
        <Text style={styles.stageText}>{tr(cat)}</Text>
      </View>
      <View style={{ width: barW, height: 34, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' }}>
          {segs.map((s) => (
            <View key={s.c} style={{ width: `${s.w * 100}%`, backgroundColor: s.c }} />
          ))}
        </View>
        <View style={[styles.marker, { left: frac * barW - 11 }]} />
      </View>
      <Text style={styles.tip}>{tr('Para a sua altura, o peso saudável fica entre {lo} e {hi} kg.', { lo, hi })}</Text>
      {goals.length > 0 && (
        <View style={styles.goalsBox}>
          <Text style={styles.cardLabel}>{tr('O seu objetivo')}</Text>
          <Text style={styles.goalsText}>{goals.map((g) => tr(g)).join(' · ')}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14, alignItems: 'center' },
    sexCard: { flex: 1, alignItems: 'center', gap: 10, paddingVertical: 20, borderRadius: radius.card, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card },
    sexOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    sexLabel: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    ground: { height: 3, width: '70%', borderRadius: 2, backgroundColor: colors.text },
    stageChip: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 5 },
    stageText: { fontSize: font.small, fontWeight: '700', color: colors.primary },
    bigRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
    bigValue: { fontSize: 52, lineHeight: 58, fontWeight: '800', color: colors.text, letterSpacing: -1 },
    bigUnit: { fontSize: font.h3, fontWeight: '600', color: colors.textMuted },
    round: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
    roundOn: { backgroundColor: colors.primary },
    tip: { fontSize: font.small, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
    cardLabel: { fontSize: font.small, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
    bmi: { fontSize: 64, lineHeight: 70, fontWeight: '800', color: colors.text, letterSpacing: -2 },
    bmiChip: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 5 },
    marker: { position: 'absolute', top: 2, width: 22, height: 30, borderRadius: 11, backgroundColor: '#fff', borderWidth: 4, borderColor: colors.text },
    goalsBox: { alignSelf: 'stretch', backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 14, gap: 4, alignItems: 'center' },
    goalsText: { fontSize: font.h3, fontWeight: '700', color: colors.text, textAlign: 'center' },
  });
