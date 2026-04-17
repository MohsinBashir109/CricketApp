import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../../components/ThemeText';
import { RootState } from '../../../../features/store/rootReducer';
import {
  selectTournamentFixtures,
  selectTournamentPointsTable,
} from '../../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../../utils/constants';

const TournamentOverviewTab = ({ tournamentId, onOpenFixtures }: any) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const fixtures = useSelector((s: RootState) => selectTournamentFixtures(s, tournamentId));
  const table = useSelector((s: RootState) => selectTournamentPointsTable(s, tournamentId));

  const nextMatch = useMemo(
    () => fixtures.find(f => f.status === 'upcoming') ?? null,
    [fixtures],
  );
  const liveMatch = useMemo(
    () => fixtures.find(f => f.status === 'live') ?? null,
    [fixtures],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemeText color="text" style={styles.sectionTitle}>
          Live / Next match
        </ThemeText>
        {liveMatch ? (
          <ThemeText color="secondaryText" style={styles.body}>
            A match is live now. Open Fixtures to resume scoring or watch.
          </ThemeText>
        ) : nextMatch ? (
          <ThemeText color="secondaryText" style={styles.body}>
            Your next fixture is ready. Open Fixtures to start scoring.
          </ThemeText>
        ) : (
          <ThemeText color="secondaryText" style={styles.body}>
            No fixtures yet. Add a fixture to start scoring.
          </ThemeText>
        )}

        <Pressable
          onPress={onOpenFixtures}
          style={[styles.link, { backgroundColor: theme.primaryMuted }]}
        >
          <ThemeText color="primary" style={styles.linkText}>
            Open fixtures
          </ThemeText>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemeText color="text" style={styles.sectionTitle}>
          Standings snapshot
        </ThemeText>
        {table.length === 0 ? (
          <ThemeText color="secondaryText" style={styles.body}>
            Points table will appear after completed matches.
          </ThemeText>
        ) : (
          table.slice(0, 4).map((row, idx) => (
            <View key={row.teamId} style={[styles.row, { borderBottomColor: theme.border }]}>
              <ThemeText color="text" style={styles.rowText}>
                {idx + 1}. {row.teamName}
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.rowMeta}>
                {row.points} pts · NRR {row.nrr}
              </ThemeText>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(32),
  },
  card: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
    marginBottom: heightPixel(12),
  },
  sectionTitle: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.bold,
  },
  body: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  link: {
    marginTop: heightPixel(12),
    paddingVertical: heightPixel(10),
    borderRadius: widthPixel(14),
    alignItems: 'center',
  },
  linkText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  row: {
    paddingVertical: heightPixel(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  rowMeta: {
    marginTop: heightPixel(3),
    fontSize: fontPixel(12),
  },
});

export default TournamentOverviewTab;

