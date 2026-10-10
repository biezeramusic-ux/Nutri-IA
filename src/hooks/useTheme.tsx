import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { detectDeviceLang, setCurrentLang, type Lang } from '../i18n';
import { darkColors, lightColors, type ThemeColors } from '../constants/theme';

/** Branco (claro) ou Preto (escuro). */
export type ThemeMode = 'light' | 'dark';

interface ThemeValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const STORAGE_KEY = 'nutria.theme';
const LANG_KEY = 'nutria.lang';

const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  isDark: false,
  mode: 'light',
  setMode: () => undefined,
  lang: 'pt',
  setLang: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = detectDeviceLang();
    setCurrentLang(initial);
    return initial;
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      })
      .catch(() => undefined);
    AsyncStorage.getItem(LANG_KEY)
      .then((saved) => {
        if (saved === 'pt' || saved === 'en') {
          setCurrentLang(saved);
          setLangState(saved);
        }
      })
      .catch(() => undefined);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setCurrentLang(next); // antes de re-desenhar, para todos os textos usarem já o novo idioma
    setLangState(next);
    AsyncStorage.setItem(LANG_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const isDark = mode === 'dark';
    return { colors: isDark ? darkColors : lightColors, isDark, mode, setMode, lang, setLang };
  }, [mode, setMode, lang, setLang]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
