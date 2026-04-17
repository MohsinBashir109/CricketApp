import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../../components/ThemeText';
import { RootState } from '../../../../features/store/rootReducer';
import { selectTournamentPointsTable } from '../../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../../utils/constants';

const TournamentPointsTab = ({ tournamentId }: any) => {
  const table = useSelector((s: RootState) => selectTournamentPointsTable(s, tournamentId));
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemeText color="text" style={styles.title}>
          Points table
        </ThemeText>
        {table.length === 0 ? (
          <ThemeText color="secondaryText" style={styles.empty}>
            No completed matches yet. Standings will update automatically after results are saved.
          </ThemeText>
        ) : (
          table.map((row, idx) => (
            <View key={row.teamId} style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={styles.rowLeft}>
                <ThemeText color="text" style={styles.rowTeam}>
                  {idx + 1}. {row.teamName}
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.rowMeta}>
                  P {row.played} · W {row.won} · L {row.lost} · NR {row.noResult}
                </ThemeText>
              </View>
              <View style={styles.rowRight}>
                <ThemeText color="text" style={styles.rowPts}>
                  {row.points}
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.rowNrr}>
                  NRR {row.nrr}
                </ThemeText>
              </View>
            </View>
          ))
        )}
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
    marginBottom: heightPixel(8),
  },
  empty: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: widthPixel(10),
    paddingVertical: heightPixel(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowTeam: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  rowMeta: {
    marginTop: heightPixel(3),
    fontSize: fontPixel(11),
  },
  rowPts: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  rowNrr: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(11),
  },
});

export default TournamentPointsTab;

