import React from 'react';
import { StyleSheet, View } from 'react-native';
import ThemeText from '../../../../components/ThemeText';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../../utils/constants';

const TournamentStatsTab = () => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.root}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemeText color="text" style={styles.title}>
          Stats
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.body}>
          This tab is wired into the tournament flow. Next, you can add leaderboards
          (runs, wickets, strike rate, economy) derived from completed matches.
        </ThemeText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(24),
    paddingHorizontal: widthPixel(12),
  },
  card: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  body: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
});

export default TournamentStatsTab;

