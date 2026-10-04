import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { radius } from '../constants/theme';

interface Props {
  title: string;
  backgroundColor: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: ViewStyle;
}

export function PayButton({
  title,
  backgroundColor,
  onPress,
  loading,
  disabled,
  leading,
  trailing,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          {leading}
          <Text style={styles.text}>{title}</Text>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { color: '#fff', fontSize: 15, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
