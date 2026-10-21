import { useEffect, useState } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './AppText';
import { useTheme } from '../hooks/useTheme';
import { mealEmoji } from '../services/foodCatalog';

/** Foto do prato tirada pela pessoa; se faltar ou não abrir, mostra o emoji do prato num fundo suave. */
export function MealPhoto({ uri, name, style, emojiSize = 30 }: { uri?: string; name: string; style: StyleProp<ViewStyle>; emojiSize?: number }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  if (uri && !failed) {
    return <Image source={{ uri }} style={style as never} resizeMode="cover" onError={() => setFailed(true)} />;
  }
  return (
    <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.limeSoft }]}>
      <Text style={{ fontSize: emojiSize }}>{mealEmoji(name)}</Text>
    </View>
  );
}
