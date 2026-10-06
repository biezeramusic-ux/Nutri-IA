import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { cardBase, colors, font, radius } from '../constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit }: Props) {
  return (
    <View style={styles.wrap}>
      <Search size={18} color={colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Pesquisar alimento (ex.: xima com matapa)"
        placeholderTextColor={colors.textFaint}
        returnKeyType="search"
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Limpar pesquisa">
          <X size={18} color={colors.textFaint} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...cardBase,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  input: { flex: 1, fontSize: font.body, color: colors.text, paddingVertical: 0 },
});
