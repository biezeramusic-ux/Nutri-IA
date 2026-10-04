import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  onPress?: (...args: never[]) => void;
  accessibilityState?: { selected?: boolean };
}

/** Botão central circular e proeminente da barra de abas. */
export function ScannerFab({ onPress, accessibilityState }: Props) {
  const focused = accessibilityState?.selected;
  return (
    <View style={styles.slot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scanner"
        onPress={(e) => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          (onPress as ((ev: unknown) => void) | undefined)?.(e);
        }}
        style={({ pressed }) => [styles.fab, focused && styles.focused, pressed && styles.pressed]}
      >
        <Ionicons name="camera" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center' },
  fab: {
    position: 'absolute',
    top: -30,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: colors.background,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  focused: { backgroundColor: colors.primaryDark },
  pressed: { transform: [{ scale: 0.94 }] },
});
