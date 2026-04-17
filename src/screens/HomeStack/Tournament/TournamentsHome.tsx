import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import { selectActiveTeams, selectAllTournaments } from '../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { routes } from '../../../utils/routes';
import HomeWrapper from '../../../wrappers/HomeWrapper';

const TournamentsHome = ({ navigation }: any) => {
  const tournaments = useSelector(selectAllTournaments);
  const teams = useSelector(selectActiveTeams);
  const { isDark } = useThemeContext();
  const themeColors = colors[isDark ? 'dark' : 'light'];

  const summary = useMemo(
    () => [
      { label: 'Saved Teams', value: String(teams.length) },
      { label: 'Tournaments', value: String(tournaments.length) },
    ],
    [teams.length, tournaments.length],
  );

  return (
    <HomeWrapper headerShown>
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
          <ThemeText color="text" style={styles.heroTitle}>
            Tournament Center
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.heroText}>
            Create open or group-based tournaments using saved teams, then review
            the structure before you start scheduling fixtures.
          </ThemeText>

          <View style={styles.summaryRow}>
            {summary.map(item => (
              <View
                key={item.label}
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: themeColors.primaryMuted,
                  },
                ]}
              >
                <ThemeText color="primary" style={styles.summaryValue}>
                  {item.value}
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.summaryLabel}>
                  {item.label}
                </ThemeText>
              </View>
            ))}
          </View>

          <Button
            title="Create Tournament"
            onPress={() => navigation.navigate(routes.createTournament)}
          />
          {teams.length < 2 ? (
            <ThemeText color="secondaryText" style={styles.helperText}>
              You can open the flow now, but you must add at least 2 teams inside
              the creation screen before you can save the tournament.
            </ThemeText>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <ThemeText color="text" style={styles.sectionTitle}>
            Saved Tournaments
          </ThemeText>
        </View>

        {tournaments.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <ThemeText color="text" style={styles.emptyTitle}>
              No tournaments yet
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.emptyText}>
              Start with a tournament name, select teams, choose open or
              group-based structure, and save the setup.
            </ThemeText>
          </View>
        ) : (
          tournaments.map(tournament => (
            <Pressable
              key={tournament.id}
              onPress={() =>
                navigation.navigate(routes.tournamentDetails, {
                  tournamentId: tournament.id,
                })
              }
              style={[
                styles.tournamentCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.tournamentHeader}>
                <ThemeText color="text" style={styles.tournamentName}>
                  {tournament.name}
                </ThemeText>
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
              </View>
              <ThemeText color="secondaryText" style={styles.tournamentMeta}>
                {tournament.formatType === 'groupBased'
                  ? `${tournament.groupCount} groups`
                  : 'Open tournament'}
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.tournamentMeta}>
                {tournament.teamCount} teams • {tournament.competitionType}
              </ThemeText>
            </Pressable>
          ))
        )}
      </ScrollView>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(32),
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: widthPixel(20),
    padding: widthPixel(18),
  },
  heroTitle: {
    fontSize: fontPixel(24),
    fontFamily: fontFamilies.bold,
  },
  heroText: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(21),
  },
  summaryRow: {
    flexDirection: 'row',
    gap: widthPixel(12),
    marginVertical: heightPixel(18),
  },
  summaryCard: {
    flex: 1,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
  },
  summaryValue: {
    fontSize: fontPixel(22),
    fontFamily: fontFamilies.bold,
  },
  summaryLabel: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(12),
  },
  helperText: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(12),
  },
  sectionHeader: {
    marginTop: heightPixel(24),
    marginBottom: heightPixel(12),
  },
  sectionTitle: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(18),
  },
  emptyTitle: {
    fontSize: fontPixel(17),
    fontFamily: fontFamilies.semibold,
  },
  emptyText: {
    marginTop: heightPixel(8),
    lineHeight: fontPixel(20),
    fontSize: fontPixel(14),
  },
  tournamentCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(16),
    marginBottom: heightPixel(12),
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: widthPixel(10),
  },
  tournamentName: {
    flex: 1,
    fontSize: fontPixel(17),
    fontFamily: fontFamilies.semibold,
  },
  badge: {
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
    borderRadius: widthPixel(999),
  },
  badgeText: {
    fontSize: fontPixel(10),
    fontFamily: fontFamilies.bold,
  },
  tournamentMeta: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(13),
  },
});

export default TournamentsHome;
