import { StyleSheet, Text, TextProps, View } from 'react-native';
import { ThemeContextType, useThemeContext } from '../theme/themeContext';

import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';

interface ThemeTextProps extends TextProps {
  color: keyof typeof colors.light | keyof typeof colors.dark;
}

const resolveColor = (
  palette: typeof colors.light | typeof colors.dark,
  key: keyof typeof colors.light,
) => {
  const v = palette[key as keyof typeof palette];
  return Array.isArray(v) ? v[0] : v;
};

const ThemeText = ({ children, style, color, ...props }: ThemeTextProps) => {
  const { isDark } = useThemeContext() as ThemeContextType;
  const palette = isDark ? colors.dark : colors.light;
  return (
    <Text
      style={[
        { fontFamily: fontFamilies.regular },
        style,
        {
          color: resolveColor(palette, color),
        },
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default ThemeText;
