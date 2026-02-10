import { ThemeType, darkTheme, lightTheme } from './theme';
import { createContext, useContext, useEffect, useState } from 'react';

import { Appearance } from 'react-native';

export type ThemeContextType = {
  theme: ThemeType;
  toggleTheme: () => void;
  isDark: boolean;
};
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () =>
  useContext(ThemeContext) as ThemeContextType;
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState<boolean>(colorScheme === 'dark');
  const toggleTheme = () => setIsDark(!isDark);
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => listener.remove();
  }, []);
  return (
    <ThemeContext.Provider
      value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
