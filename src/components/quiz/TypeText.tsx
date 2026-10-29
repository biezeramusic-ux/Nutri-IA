import { useEffect, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from '../AppText';

/** Texto que aparece letra a letra, devagar. O espaço fica reservado (texto invisível) para a tela não saltar. */
export function TypeText({ text, style, delay = 350, msPerChar = 38 }: { text: string; style?: StyleProp<TextStyle>; delay?: number; msPerChar?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        setN((v) => {
          if (v >= text.length) {
            if (timer) clearInterval(timer);
            return v;
          }
          return v + 1;
        });
      }, msPerChar);
    }, delay);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
  }, [text, delay, msPerChar]);
  return (
    <Text style={style}>
      {text.slice(0, n)}
      <Text style={{ opacity: 0 }}>{text.slice(n)}</Text>
    </Text>
  );
}
