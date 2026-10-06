import { Image, type ImageStyle, type StyleProp } from 'react-native';

interface Props {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/** Marca do Nutri IA (transparente, funciona em fundos claros). */
export function Logo({ size = 72, style }: Props) {
  return (
    <Image
      source={require('../../assets/logo-mark.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="Nutri IA"
    />
  );
}
