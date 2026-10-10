import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { tr } from '../i18n';

/** Traduz um texto simples (chave = português) preservando espaços nas pontas. */
function translateChild(child: ReactNode): ReactNode {
  if (typeof child !== 'string') return child;
  const trimmed = child.trim();
  if (!trimmed) return child;
  const lead = child.slice(0, child.indexOf(trimmed));
  const tail = child.slice(child.indexOf(trimmed) + trimmed.length);
  return `${lead}${tr(trimmed)}${tail}`;
}

/**
 * Substitui o Text do React Native: traduz automaticamente os textos (em português)
 * para o idioma escolhido. Texto sem tradução aparece como está.
 */
export function Text({ children, ...rest }: TextProps) {
  const content = Children.map(children, (c) => {
    if (isValidElement(c)) return cloneElement(c);
    return translateChild(c);
  });
  return <RNText {...rest}>{content}</RNText>;
}
