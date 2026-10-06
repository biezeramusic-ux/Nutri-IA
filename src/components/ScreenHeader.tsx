import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../constants/theme';

interface Props {
  title: string;
  right?: ReactNode;
}

/** Cabeçalho das telas abertas por cima das abas (voltar + título). */
export function ScreenHeader({ title, right }: Props) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Voltar">
        <ChevronLeft size={20} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: font.h2, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  right: { minWidth: 36, alignItems: 'flex-end' },
});
