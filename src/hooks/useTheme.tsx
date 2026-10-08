import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'nutria.theme';

const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  isDark: false,
  mode: 'light',
  setMode: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      })
      .catch(() => undefined);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
    return { colors: isDark ? darkColors : lightColors, isDark, mode, setMode };
  }, [mode, system, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
