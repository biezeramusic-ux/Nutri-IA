import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from '../AppText';
import { font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { tr } from '../../i18n';

/** Peso ao longo de 6 meses: dieta tradicional (desce e volta a subir) contra acompanhamento diário (desce e fica). */
export function MaintainChart({ width }: { width: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const w = width - 32;
  const h = 170;
  const trad = `M 8 28 C ${w * 0.25} 30, ${w * 0.3} 120, ${w * 0.42} 118 S ${w * 0.7} 20, ${w - 8} 30`;
  const ours = `M 8 28 C ${w * 0.3} 30, ${w * 0.45} 100, ${w * 0.7} 134 S ${w * 0.9} 140, ${w - 8} 140`;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{tr('O seu peso')}</Text>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id="mt" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#86EFAC" />
            <Stop offset="1" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        <Path d={trad} stroke="#F87171" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d={ours} stroke="url(#mt)" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Circle cx={8} cy={28} r={6} fill="#fff" stroke={colors.text} strokeWidth={3} />
        <Circle cx={w - 8} cy={140} r={7} fill={colors.primary} stroke="#fff" strokeWidth={3} />
      </Svg>
      <View style={styles.legend}>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.lt}>Nutri AI</Text>
        </View>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: '#F87171' }]} />
          <Text style={styles.lt}>{tr('Dieta tradicional')}</Text>
        </View>
      </View>
      <View style={styles.axis}>
        <Text style={styles.ax}>{tr('Mês 1')}</Text>
        <Text style={styles.ax}>{tr('Mês 6')}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
    title: { fontSize: font.h3, fontWeight: '800', color: colors.text },
    legend: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    lt: { fontSize: font.small, color: colors.textMuted, fontWeight: '600' },
    axis: { flexDirection: 'row', justifyContent: 'space-between' },
    ax: { fontSize: font.small, fontWeight: '700', color: colors.text },
  });
