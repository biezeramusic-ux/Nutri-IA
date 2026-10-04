import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Pesquisar alimento (ex: xima com matapa)"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
      />
      {value.length > 0 && (
        <Ionicons name="close-circle" size={20} color={colors.textMuted} onPress={() => onChangeText('')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    height: 54,
    ...shadow,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
});
