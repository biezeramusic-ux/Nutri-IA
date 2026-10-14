import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Keyboard, StyleSheet, View, useWindowDimensions } from 'react-native';

const PHOTOS = [
  require('../../assets/auth-scan-1.jpg'),
  require('../../assets/auth-scan-2.jpg'),
  require('../../assets/auth-scan-3.jpg'),
];

// Onde fica o telemóvel em cada foto (fração da altura), para a faixa mostrar sempre o ecrã com o prato.
const FOCUS = [0.32, 0.33, 0.46];
const STRIP_HEIGHT = 170;
const HOLD_MS = 3200;
const IN_MS = 900;

/**
 * Faixa de fotografias no fundo do ecrã de entrada/registo, abaixo do fundo verde.
 * Entram uma depois da outra, com uma subida suave, e voltam ao início em ciclo.
 */
export function AuthPhotoStrip({ bottomInset }: { bottomInset: number }) {
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const opacity = useRef(PHOTOS.map(() => new Animated.Value(0))).current;
  const rise = useRef(PHOTOS.map(() => new Animated.Value(28))).current;
  const stripRise = useRef(new Animated.Value(STRIP_HEIGHT)).current;

  // A faixa sobe do fundo ao abrir o ecrã.
  useEffect(() => {
    Animated.timing(stripRise, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [stripRise]);

  // Esconde a faixa enquanto o teclado está aberto (para não ocupar o ecrã).
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Ciclo: a foto ativa entra (sobe e aparece); a anterior desvanece.
  useEffect(() => {
    PHOTOS.forEach((_, i) => {
      if (i === active) {
        rise[i].setValue(28);
        Animated.parallel([
          Animated.timing(opacity[i], { toValue: 1, duration: IN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(rise[i], { toValue: 0, duration: IN_MS + 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      } else {
        Animated.timing(opacity[i], { toValue: 0, duration: IN_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
      }
    });
    const t = setTimeout(() => setActive((a) => (a + 1) % PHOTOS.length), HOLD_MS + IN_MS);
    return () => clearTimeout(t);
  }, [active, opacity, rise]);

  if (keyboardOpen) return null;

  // As fotos são verticais: mostra-se só a zona do telemóvel.
  const imageHeight = width * 1.5;

  return (
    <Animated.View style={[styles.strip, { height: STRIP_HEIGHT + bottomInset, transform: [{ translateY: stripRise }] }]}>
      {PHOTOS.map((src, i) => (
        <Animated.View key={i} style={[StyleSheet.absoluteFill, { opacity: opacity[i], transform: [{ translateY: rise[i] }] }]}>
          <Image source={src} style={{ width, height: imageHeight, marginTop: -imageHeight * FOCUS[i] }} resizeMode="cover" />
        </Animated.View>
      ))}
      <View style={styles.shade} />
      <View style={styles.dots}>
        {PHOTOS.map((_, i) => (
          <View key={i} style={[styles.dot, i === active && styles.dotOn]} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  strip: { overflow: 'hidden', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#14532D' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.10)' },
  dots: { position: 'absolute', top: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotOn: { width: 18, backgroundColor: '#fff' },
});
