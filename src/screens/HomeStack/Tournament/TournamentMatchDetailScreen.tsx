import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import { RootState } from '../../../features/store/rootReducer';
import {
  selectFixtureResultSummary,
  selectTournamentById,
  selectTournamentTeams,
} from '../../../features/tournament/tournamentSelectors';
import { setFixtureLive } from '../../../features/tournament/tournamentSlice';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { routes } from '../../../utils/routes';
import HomeWrapper from '../../../wrappers/HomeWrapper';

const TournamentMatchDetailScreen = ({ route, navigation }: any) => {
  const dispatch = useDispatch();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const tournamentId = route?.params?.tournamentId as string;
  const fixtureId = route?.params?.fixtureId as string;

  const tournament = useSelector((s: RootState) =>
    selectTournamentById(s, tournamentId),
  );
  const fixture = useSelector((s: RootState) => s.tournament.fixturesById[fixtureId]);
  const match = useSelector((s: RootState) =>
    fixture?.matchId ? (s.match.history ?? []).find((m: any) => m.matchId === fixture.matchId) : null,
  );
  const teams = useSelector((s: RootState) => selectTournamentTeams(s, tournamentId));
  const resultSummary = useSelector((s: RootState) =>
    selectFixtureResultSummary(s, fixtureId),
  );

  const teamA = useMemo(
    () => teams.find(t => t.id === fixture?.teamAId) ?? null,
    [teams, fixture?.teamAId],
  );
  const teamB = useMemo(
    () => teams.find(t => t.id === fixture?.teamBId) ?? null,
    [teams, fixture?.teamBId],
  );

  if (!tournament || !fixture) {
    return (
      <HomeWrapper>
        <View style={styles.missing}>
          <ThemeText color="text" style={styles.title}>
            Match not found
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.sub}>
            The selected fixture could not be loaded.
          </ThemeText>
        </View>
      </HomeWrapper>
    );
  }

  const statusLabel = fixture.status.replace('_', ' ').toUpperCase();
  const canStart =
    fixture.status === 'upcoming' || (fixture.status === 'live' && !!fixture.matchId);

  return (
    <HomeWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemeText color="text" style={styles.title}>
            {teamA?.name ?? 'Team A'} vs {teamB?.name ?? 'Team B'}
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.sub}>
            {tournament.name}
          </ThemeText>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.primaryMuted }]}>
              <ThemeText color="primary" style={styles.badgeText}>
                {statusLabel}
              </ThemeText>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.primaryMuted }]}>
              <ThemeText color="primary" style={styles.badgeText}>
                {fixture.overs ? `T${fixture.overs}` : 'OVERS TBD'}
              </ThemeText>
            </View>
          </View>
        </View>

        {fixture.status === 'completed' ? (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ThemeText color="text" style={styles.sectionTitle}>
              Result
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.sub}>
              {resultSummary ?? 'Result saved'}
            </ThemeText>
          </View>
        ) : null}

        <View style={styles.ctaArea}>
          {fixture.status === 'completed' ? (
            <Button
              title="View match summary"
              onPress={() => {
                if (match) navigation.navigate(routes.matchsummary, { match });
              }}
            />
          ) : fixture.status === 'live' && fixture.matchId ? (
            <Button
              title="Resume scoring"
              onPress={() => navigation.navigate(routes.matchscoring)}
            />
          ) : (
            <Button
              title="Start scoring"
              onPress={() => {
                // Mark fixture live now (the matchId will be created inside StartMatchPager)
                // We generate a stable matchId here so tournament linkage is consistent.
                const matchId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                dispatch(setFixtureLive({ tournamentId, fixtureId, matchId }));
                navigation.navigate(routes.startMatch, {
                  presetMatch: {
                    tournamentId,
                    fixtureId,
                    matchId,
                    teamA,
                    teamB,
                    overs: fixture.overs,
                  },
                });
              }}
              disabled={!canStart || !teamA || !teamB}
            />
          )}

          <Pressable
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <ThemeText color="secondaryText" style={styles.backText}>
              Back to fixtures
            </ThemeText>
          </Pressable>
        </View>
      </ScrollView>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: heightPixel(18),
    paddingBottom: heightPixel(36),
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: widthPixel(18),
  },
  card: {
    borderWidth: 1,
    borderRadius: widthPixel(20),
    padding: widthPixel(16),
    marginBottom: heightPixel(14),
  },
  title: {
    fontSize: fontPixel(20),
    fontFamily: fontFamilies.bold,
  },
  sub: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
    marginTop: heightPixel(14),
  },
  badge: {
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(12),
    borderRadius: widthPixel(999),
  },
  badgeText: {
    fontSize: fontPixel(11),
    fontFamily: fontFamilies.bold,
  },
  sectionTitle: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.bold,
  },
  ctaArea: {
    paddingHorizontal: widthPixel(2),
    marginTop: heightPixel(6),
  },
  backLink: {
    marginTop: heightPixel(14),
    alignItems: 'center',
  },
  backText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.medium,
  },
});

export default TournamentMatchDetailScreen;

