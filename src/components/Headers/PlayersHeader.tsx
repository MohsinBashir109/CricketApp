import { StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import React from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

const PlayersHeader = () => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <View style={styles.colSr}>
        <ThemeText style={styles.text} color="text">
          Sr#
        </ThemeText>
      </View>

      <View style={styles.colName}>
        <ThemeText style={styles.text} color="text">
          Player Name
        </ThemeText>
      </View>

      <View style={styles.colRole}>
        <ThemeText style={styles.text} color="text">
          Role
        </ThemeText>
      </View>
    </View>
  );
};

export default PlayersHeader;

const styles = StyleSheet.create({
  container: {
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(10),
    borderTopLeftRadius: widthPixel(10),
    borderTopRightRadius: widthPixel(10),
    marginTop: heightPixel(20),

    flexDirection: 'row',
    alignItems: 'center', // vertical alignment
  },

  // ✅ SAME widths used in row component
  colSr: {
    flex: 0.2,
    alignItems: 'flex-start', // change to 'center' if you want centered
  },
  colName: {
    flex: 0.65,
    paddingHorizontal: widthPixel(6),
  },
  colRole: {
    flex: 0.15,
    alignItems: 'center',
  },

  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});
