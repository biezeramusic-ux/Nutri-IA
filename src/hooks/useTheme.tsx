import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { detectDeviceLang, setCurrentLang, type Lang } from '../i18n';
import { ACCENTS, applyAccent, darkColors, lightColors, type AccentId, type ThemeColors } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  accent: AccentId;
  setAccent: (accent: AccentId) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const STORAGE_KEY = 'nutria.theme';
const ACCENT_KEY = 'nutria.accent';
const LANG_KEY = 'nutria.lang';

const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  isDark: false,
  mode: 'light',
  setMode: () => undefined,
  accent: 'green',
  setAccent: () => undefined,
  lang: 'pt',
  setLang: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [accent, setAccentState] = useState<AccentId>('green');
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = detectDeviceLang();
    setCurrentLang(initial);
    return initial;
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
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
    AsyncStorage.getItem(ACCENT_KEY)
      .then((saved) => {
        if (ACCENTS.some((a) => a.id === saved)) setAccentState(saved as AccentId);
      })
      .catch(() => undefined);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const setAccent = useCallback((next: AccentId) => {
    setAccentState(next);
    AsyncStorage.setItem(ACCENT_KEY, next).catch(() => undefined);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setCurrentLang(next); // antes de re-desenhar, para todos os textos usarem já o novo idioma
    setLangState(next);
    AsyncStorage.setItem(LANG_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
    return { colors: applyAccent(isDark ? darkColors : lightColors, accent, isDark), isDark, mode, setMode, accent, setAccent, lang, setLang };
  }, [mode, system, setMode, accent, setAccent, lang, setLang]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
