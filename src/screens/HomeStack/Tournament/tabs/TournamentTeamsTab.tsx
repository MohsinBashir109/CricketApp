import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../../components/ThemeText';
import { RootState } from '../../../../features/store/rootReducer';
import {
  selectTournamentById,
  selectTournamentTeams,
} from '../../../../features/tournament/tournamentSelectors';
import type { TeamEntity } from '../../../../types/TournamentTypes';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../../utils/constants';
import { cardShadowSm } from '../../../../utils/cardShadow';
import { routes } from '../../../../utils/routes';

function teamInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

const TournamentTeamsTab = ({
  tournamentId,
  navigation,
}: {
  tournamentId: string;
  navigation: { navigate: (name: string, params?: object) => void };
}) => {
  const tournament = useSelector((s: RootState) =>
    selectTournamentById(s, tournamentId),
  );
  const teams = useSelector((s: RootState) =>
    selectTournamentTeams(s, tournamentId),
  );
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const heading = useMemo(() => {
    const n = tournament?.name?.trim();
    return n ? `${n} — teams & squads` : 'Teams & squads';
  }, [tournament?.name]);

  const openSquad = (team: TeamEntity) => {
    navigation.navigate(routes.tournamentTeamSquad, {
      tournamentId,
      teamId: team.id,
    });
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <ThemeText color="text" style={styles.title}>
          {heading}
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.subtitle}>
          Tap a team to open its squad on a separate screen.
        </ThemeText>

        {teams.length === 0 ? (
          <ThemeText color="secondaryText" style={styles.emptyTeams}>
            No teams linked to this tournament yet.
          </ThemeText>
        ) : (
          teams.map((team, index) => {
            const count = team.players?.length ?? 0;
            return (
              <Pressable
                key={team.id}
                onPress={() => openSquad(team)}
                style={({ pressed }) => [
                  index > 0
                    ? [styles.teamDivider, { borderTopColor: theme.border }]
                    : null,
                  pressed ? { opacity: 0.88 } : null,
                ]}
              >
                <View style={styles.teamHeader}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.primaryMuted, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {teamInitials(team.name)}
                    </Text>
                  </View>
                  <View style={styles.teamHeaderText}>
                    <ThemeText color="text" style={styles.teamName} numberOfLines={2}>
                      {team.name}
                    </ThemeText>
                    <ThemeText color="secondaryText" style={styles.teamMeta}>
                      {count === 0 ? 'No players' : `${count} player${count === 1 ? '' : 's'}`}
                    </ThemeText>
                  </View>
                  <Text style={[styles.chevron, { color: theme.secondaryText }]}>›</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  content: {
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(32),
    width: '100%',
    alignSelf: 'stretch',
  },
  card: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
    alignSelf: 'stretch',
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    marginBottom: heightPixel(6),
  },
  subtitle: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    marginBottom: heightPixel(12),
  },
  emptyTeams: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
    marginTop: heightPixel(4),
  },
  teamDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(12),
    minWidth: 0,
  },
  avatar: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthPixel(12),
  },
  avatarText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  teamHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  teamName: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(15),
  },
  teamMeta: {
    marginTop: heightPixel(3),
    fontSize: fontPixel(12),
  },
  chevron: {
    fontSize: fontPixel(22),
    marginLeft: widthPixel(6),
    fontFamily: fontFamilies.semibold,
  },
});

export default TournamentTeamsTab;
