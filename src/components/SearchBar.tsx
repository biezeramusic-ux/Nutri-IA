import { useMemo } from 'react';
import { Search, X } from 'lucide-react-native';
import { StyleSheet, TextInput, View } from 'react-native';
import { Pressable } from '../components/AppPressable';
import { cardBase, font, radius, type ThemeColors } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { tr } from '../i18n';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Search size={18} color={colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={tr('Pesquisar alimento (ex.: xima com matapa)')}
        placeholderTextColor={colors.textFaint}
        returnKeyType="search"
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel={tr('Limpar pesquisa')}>
          <X size={18} color={colors.textFaint} />
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  wrap: {
    ...cardBase(colors),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  input: { flex: 1, fontSize: font.body, color: colors.text, paddingVertical: 0 },
});
