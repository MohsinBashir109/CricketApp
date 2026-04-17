import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../components/ThemeText';
import {
  selectTournamentById,
  selectTournamentGroups,
  selectTournamentTeams,
} from '../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { RootState } from '../../../features/store/rootReducer';

const TournamentDetailsScreen = ({ route }: any) => {
  const tournamentId = route?.params?.tournamentId as string;
  const tournament = useSelector((state: RootState) =>
    selectTournamentById(state, tournamentId),
  );
  const groups = useSelector((state: RootState) =>
    selectTournamentGroups(state, tournamentId),
  );
  const teams = useSelector((state: RootState) =>
    selectTournamentTeams(state, tournamentId),
  );
  const { isDark } = useThemeContext();
  const themeColors = colors[isDark ? 'dark' : 'light'];

  if (!tournament) {
    return (
      <HomeWrapper>
        <View style={styles.missingState}>
          <ThemeText color="text" style={styles.title}>
            Tournament not found
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.subtitle}>
            The selected tournament could not be loaded from local storage.
          </ThemeText>
        </View>
      </HomeWrapper>
    );
  }

  return (
    <HomeWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <ThemeText color="text" style={styles.title}>
            {tournament.name}
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.subtitle}>
            {tournament.competitionType} •{' '}
            {tournament.formatType === 'groupBased'
              ? 'Group-Based Tournament'
              : 'Open Tournament'}
          </ThemeText>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: themeColors.primaryMuted },
              ]}
            >
              <ThemeText color="primary" style={styles.badgeText}>
                {tournament.status.toUpperCase()}
              </ThemeText>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: themeColors.primaryMuted },
              ]}
            >
              <ThemeText color="primary" style={styles.badgeText}>
                {tournament.teamCount} TEAMS
              </ThemeText>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <ThemeText color="text" style={styles.sectionTitle}>
            Selected Teams
          </ThemeText>
          {teams.map(team => (
            <View
              key={team.id}
              style={[styles.row, { borderBottomColor: themeColors.border }]}
            >
              <ThemeText color="text" style={styles.rowTitle}>
                {team.name}
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.rowMeta}>
                {team.players.length} players
              </ThemeText>
            </View>
          ))}
        </View>

        {tournament.formatType === 'groupBased' ? (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <ThemeText color="text" style={styles.sectionTitle}>
              Groups
            </ThemeText>
            {groups.map(group => (
              <View
                key={group.id}
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: themeColors.surfaceElevated,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <ThemeText color="text" style={styles.rowTitle}>
                  {group.name}
                </ThemeText>
                {group.teamIds.map(teamId => {
                  const team = teams.find(item => item.id === teamId);
                  return (
                    <ThemeText key={teamId} color="secondaryText" style={styles.rowMeta}>
                      {team?.name ?? 'Unknown team'}
                    </ThemeText>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <ThemeText color="text" style={styles.sectionTitle}>
              Open Tournament Pool
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.subtitle}>
              All selected teams compete in a single tournament structure without
              groups.
            </ThemeText>
          </View>
        )}

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <ThemeText color="text" style={styles.sectionTitle}>
            Tournament Metadata
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.rowMeta}>
            Created: {new Date(tournament.createdAt).toLocaleString()}
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.rowMeta}>
            Updated: {new Date(tournament.updatedAt).toLocaleString()}
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.rowMeta}>
            Winner: {tournament.winnerTeamId ? tournament.winnerTeamId : 'TBD'}
          </ThemeText>
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
  missingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: widthPixel(20),
    padding: widthPixel(18),
    marginBottom: heightPixel(14),
  },
  title: {
    fontSize: fontPixel(24),
    fontFamily: fontFamilies.bold,
  },
  subtitle: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
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
  sectionCard: {
    borderWidth: 1,
    borderRadius: widthPixel(20),
    padding: widthPixel(16),
    marginBottom: heightPixel(14),
  },
  sectionTitle: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
    marginBottom: heightPixel(8),
  },
  row: {
    paddingVertical: heightPixel(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.semibold,
  },
  rowMeta: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
    marginTop: heightPixel(10),
  },
});

export default TournamentDetailsScreen;
