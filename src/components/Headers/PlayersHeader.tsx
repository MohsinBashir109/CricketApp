import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import ThemeText from '../ThemeText';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
const PlayersHeader = () => {
  const { isDark } = useThemeContext();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors[isDark ? 'dark' : 'light'].primary },
      ]}
    >
      <View style={styles.name}>
        <ThemeText style={styles.playername} color="text">
          Player Name
        </ThemeText>
      </View>

      <View>
        <ThemeText style={styles.playername} color="text">
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
  },
  name: { flex: 0.8 },
  playername: { fontFamily: fontFamilies.semibold, fontSize: fontPixel(14) },
});
