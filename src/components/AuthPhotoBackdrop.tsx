import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';

const PHOTOS = [
  require('../../assets/auth-scan-1.jpg'),
  require('../../assets/auth-scan-2.jpg'),
  require('../../assets/auth-scan-3.jpg'),
];

// Posição do ecrã do telemóvel em cada foto (fração da largura e da altura), para ficar visível acima do formulário.
const FOCUS = [
  { x: 0.55, y: 0.43 },
  { x: 0.55, y: 0.45 },
  { x: 0.46, y: 0.6 },
];

const HOLD_MS = 4200;
const IN_MS = 1300;

/**
 * Fundo animado do ecrã de entrada/registo: as fotografias passam uma depois da outra,
 * como um vídeo a rolar (entram pela direita, com um zoom lento). A camada verde fica por cima.
 */
export function AuthPhotoBackdrop() {
  const { width, height } = useWindowDimensions();
  // Foto maior que o ecrã, deslocada para o telemóvel ficar na parte de cima (o cartão cobre a de baixo).
  const imgH = height * 1.35;
  const imgW = imgH / 1.5;
  const [active, setActive] = useState(0);
  const prev = useRef<number | null>(null);
  const opacity = useRef(PHOTOS.map(() => new Animated.Value(0))).current;
  const slide = useRef(PHOTOS.map(() => new Animated.Value(70))).current;
  const zoom = useRef(PHOTOS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // Foto que entra: aparece, desliza da direita e faz zoom lento.
    slide[active].setValue(70);
    zoom[active].setValue(1);
    Animated.parallel([
      Animated.timing(opacity[active], { toValue: 1, duration: IN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide[active], { toValue: 0, duration: IN_MS + 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(zoom[active], { toValue: 1.14, duration: HOLD_MS + IN_MS * 2, easing: Easing.linear, useNativeDriver: true }),
    ]).start();

    // Foto anterior: desvanece e continua a deslizar para a esquerda.
    const p = prev.current;
    if (p !== null && p !== active) {
      Animated.parallel([
        Animated.timing(opacity[p], { toValue: 0, duration: IN_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(slide[p], { toValue: -60, duration: IN_MS + 400, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
    prev.current = active;

    const t = setTimeout(() => setActive((a) => (a + 1) % PHOTOS.length), HOLD_MS + IN_MS);
    return () => clearTimeout(t);
  }, [active, opacity, slide, zoom]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#243B2A' }]} pointerEvents="none">
      {PHOTOS.map((src, i) => (
        <Animated.Image
          key={i}
          source={src}
          resizeMode="cover"
          style={{
            position: 'absolute',
            width: imgW,
            height: imgH,
            left: width / 2 - imgW * FOCUS[i].x,
            top: height * 0.25 - imgH * FOCUS[i].y,
            opacity: opacity[i],
            transform: [{ translateX: slide[i] }, { scale: zoom[i] }],
          }}
        />
      ))}
    </View>
  );
}
