import { StyleSheet, Text, TextProps, View } from 'react-native';
import { ThemeContextType, useThemeContext } from '../theme/themeContext';

import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';

interface ThemeTextProps extends TextProps {
  color: keyof typeof colors.light | keyof typeof colors.dark;
}

const ThemeText = ({ children, style, color, ...props }: ThemeTextProps) => {
  const { isDark } = useThemeContext() as ThemeContextType;
  return (
    <Text
      style={[
        { fontFamily: fontFamilies.regular },
        style,
        {
          color: isDark
            ? colors.dark[color as keyof typeof colors.dark]
            : colors.light[color as keyof typeof colors.light],
        },
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default ThemeText;
