import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';
import { MacroGlyph, type MacroKind } from './MacroGlyph';
import { ProgressRing } from './ProgressRing';

interface Props {
  label: string;
  kind: MacroKind;
  /** Gramas que ainda faltam. */
  leftG: number;
  /** 0 a 1 (consumido / meta). */
  progress: number;
  color: string;
}

/** Cartão de um macro: gramas que faltam e um anel com o ícone do macro no centro. */
export function MacroLeftBar({ label, kind, leftG, progress, color }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{Math.max(0, Math.round(leftG))}g</Text>
      <Text style={styles.label} numberOfLines={1}>
        {tr('{label} restante', { label: tr(label) })}
      </Text>
      <View style={styles.ring}>
        <ProgressRing size={62} strokeWidth={6} progress={progress} color={color}>
          <MacroGlyph kind={kind} color={color} size={22} />
        </ProgressRing>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { ...cardBase(colors), flex: 1, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 10, gap: 2 },
    value: { fontSize: font.h2, fontWeight: '800', color: colors.text },
    label: { fontSize: font.tiny, color: colors.textMuted, marginBottom: 8 },
    ring: { alignItems: 'center' },
  });
