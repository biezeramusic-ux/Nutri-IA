import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cardBase, font, radius, type ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  question: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}

/** Pergunta com resposta Sim / Não. */
export function YesNoRow({ question, value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.buttons}>
        <Pressable onPress={() => onChange(true)} style={[styles.btn, value === true && styles.btnOn]}>
          <Text style={[styles.btnText, value === true && styles.btnTextOn]}>Sim</Text>
        </Pressable>
        <Pressable onPress={() => onChange(false)} style={[styles.btn, value === false && styles.btnOn]}>
          <Text style={[styles.btnText, value === false && styles.btnTextOn]}>Não</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: { ...cardBase(colors), borderRadius: radius.lg, padding: 14, gap: 10 },
  question: { fontSize: font.body, fontWeight: '500', color: colors.text, lineHeight: 20 },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, height: 38, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  btnOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  btnText: { fontSize: font.body, fontWeight: '600', color: colors.textMuted },
  btnTextOn: { color: colors.primaryDark },
});
