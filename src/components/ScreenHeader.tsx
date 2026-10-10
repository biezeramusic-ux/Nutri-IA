import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../components/AppText';
import { font, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';

interface Props {
  title: string;
  right?: ReactNode;
}

/** Cabeçalho das telas abertas por cima das abas (voltar + título). */
export function ScreenHeader({ title, right }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel={tr('Voltar')}>
        <ChevronLeft size={20} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: font.h2, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  right: { minWidth: 36, alignItems: 'flex-end' },
});
