import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../../components/ThemeText';
import { RootState } from '../../../../features/store/rootReducer';
import { selectTournamentTeams } from '../../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../../utils/constants';

const TournamentTeamsTab = ({ tournamentId }: any) => {
  const teams = useSelector((s: RootState) => selectTournamentTeams(s, tournamentId));
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemeText color="text" style={styles.title}>
          Teams & squads
        </ThemeText>
        {teams.map(team => (
          <View key={team.id} style={[styles.row, { borderBottomColor: theme.border }]}>
            <ThemeText color="text" style={styles.rowTitle}>
              {team.name}
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.rowMeta}>
              {team.players.length} players
            </ThemeText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(32),
  },
  card: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    marginBottom: heightPixel(6),
  },
  row: {
    paddingVertical: heightPixel(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  rowMeta: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(12),
  },
});

export default TournamentTeamsTab;

