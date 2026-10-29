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
 * como um vídeo a rolar (a nova foto entra por cima da anterior, com um zoom lento). A camada verde fica por cima.
 */
export function AuthPhotoBackdrop() {
  const { width, height } = useWindowDimensions();
  // Foto maior que o ecrã, deslocada para o telemóvel ficar na parte de cima (o cartão cobre a de baixo).
  const imgH = height * 1.15;
  const imgW = imgH / 1.5;
  const [active, setActive] = useState(0);
  const prev = useRef<number | null>(null);
  const opacity = useRef(PHOTOS.map(() => new Animated.Value(0))).current;
  const slide = useRef(PHOTOS.map(() => new Animated.Value(70))).current;
  const zoom = useRef(PHOTOS.map(() => new Animated.Value(1))).current;

  // A foto que chega fica por cima das outras; a anterior fica quieta por baixo até a nova estar completa.
  const layer = useRef<number[]>(PHOTOS.map((_, i) => (i === 0 ? 1 : 0))).current;
  const counter = useRef(1);
  const [, force] = useState(0);

  useEffect(() => {
    counter.current += 1;
    layer[active] = counter.current;
    force((n) => n + 1);

    opacity[active].setValue(0);
    slide[active].setValue(60);
    zoom[active].setValue(1);
    Animated.parallel([
      Animated.timing(opacity[active], { toValue: 1, duration: IN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide[active], { toValue: 0, duration: IN_MS + 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(zoom[active], { toValue: 1.14, duration: HOLD_MS + IN_MS * 2, easing: Easing.linear, useNativeDriver: true }),
    ]).start(() => {
      // Nova foto já cobre tudo: esconde a anterior sem qualquer efeito visível.
      const p = prev.current;
      if (p !== null && p !== active) opacity[p].setValue(0);
      prev.current = active;
    });

    const t = setTimeout(() => setActive((a) => (a + 1) % PHOTOS.length), HOLD_MS + IN_MS);
    return () => clearTimeout(t);
  }, [active, opacity, slide, zoom, layer]);

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
            top: Math.max(height - imgH, Math.min(0, height * 0.22 - imgH * FOCUS[i].y)),
            zIndex: layer[i],
            opacity: opacity[i],
            transform: [{ translateX: slide[i] }, { scale: zoom[i] }],
          }}
        />
      ))}
    </View>
  );
}
