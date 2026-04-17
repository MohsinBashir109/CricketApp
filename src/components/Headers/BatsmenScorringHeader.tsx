import { StyleSheet, View } from 'react-native';
import { widthPixel, fontPixel, heightPixel } from '../../utils/constants';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

type Variant = 'batting' | 'bowling';

const BatsmenBowlerScorringHeader = ({
  title,
  variant = 'batting',
}: {
  title: string;
  variant?: Variant;
}) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={{ flex: 1.4 }}>
        <ThemeText style={styles.title} color="secondaryText">
          {title}
        </ThemeText>
      </View>
      {variant === 'batting' ? (
        <View style={styles.cols}>
          <ThemeText style={styles.col} color="desText">
            R
          </ThemeText>
          <ThemeText style={styles.col} color="desText">
            B
          </ThemeText>
          <ThemeText style={[styles.col, styles.colWide]} color="desText">
            SR
          </ThemeText>
        </View>
      ) : (
        <View style={styles.cols}>
          <ThemeText style={styles.col} color="desText">
            O
          </ThemeText>
          <ThemeText style={styles.col} color="desText">
            M
          </ThemeText>
          <ThemeText style={styles.col} color="desText">
            R
          </ThemeText>
          <ThemeText style={styles.col} color="desText">
            W
          </ThemeText>
          <ThemeText style={[styles.col, styles.colEcon]} color="desText">
            Econ
          </ThemeText>
        </View>
      )}
    </View>
  );
};

export default BatsmenBowlerScorringHeader;

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(12),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cols: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: widthPixel(4),
  },
  col: {
    width: widthPixel(36),
    textAlign: 'right',
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
  colWide: {
    width: widthPixel(44),
  },
  colEcon: {
    width: widthPixel(48),
  },
});
