import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import { RootState } from '../../../features/store/rootReducer';
import {
  selectTournamentById,
  selectTournamentTeams,
} from '../../../features/tournament/tournamentSelectors';
import type { TeamPlayer } from '../../../types/TournamentTypes';
import type { PlayerRole } from '../../../types/Playertype';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowSm } from '../../../utils/cardShadow';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import AddPlayersToTeamScreen, {
  type SquadPlayer as SquadPlayerDraft,
  type TeamRoleLabel,
} from '../AddPlayers/AddPlayersToTeamScreen';
import { updateTeam } from '../../../features/teams/teamsSlice';

function teamInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

function roleLabel(role: PlayerRole | undefined): string {
  if (!role) return 'Player';
  const map: Record<PlayerRole, string> = {
    batsman: 'Batter',
    bowler: 'Bowler',
    allrounder: 'All-rounder',
    wicketkeeper: 'Wicket-keeper',
  };
  return map[role] ?? role;
}

const roleToLabel: Record<PlayerRole, TeamRoleLabel> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-Rounder',
  wicketkeeper: 'Wicketkeeper',
};

const labelToRole: Record<TeamRoleLabel, PlayerRole> = {
  Batsman: 'batsman',
  Bowler: 'bowler',
  'All-Rounder': 'allrounder',
  Wicketkeeper: 'wicketkeeper',
};

const TournamentTeamSquadScreen = ({ route, navigation }: any) => {
  const dispatch = useDispatch();
  const tournamentId = route?.params?.tournamentId as string;
  const teamId = route?.params?.teamId as string;

  const tournament = useSelector((s: RootState) =>
    selectTournamentById(s, tournamentId),
  );
  const teams = useSelector((s: RootState) =>
    selectTournamentTeams(s, tournamentId),
  );
  const team = useMemo(
    () => teams.find(t => t.id === teamId) ?? null,
    [teams, teamId],
  );

  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const [showSquadEditor, setShowSquadEditor] = useState(false);

  if (!tournament || !team) {
    return (
      <HomeWrapper>
        <View style={styles.missing}>
          <ThemeText color="text" style={styles.title}>
            Team not found
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.sub}>
            This team is not part of this tournament or was removed.
          </ThemeText>
          <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
            <ThemeText color="primary" style={styles.backText}>
              Go back
            </ThemeText>
          </Pressable>
        </View>
      </HomeWrapper>
    );
  }

  const players = team.players ?? [];
  const canAddNow = (team as any)?.playerAddTiming !== 'during_match';

  return (
    <HomeWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backRow}
          hitSlop={12}
        >
          <Text style={[styles.backChevron, { color: theme.primary }]}>‹</Text>
          <ThemeText color="primary" style={styles.backRowText}>
            Teams
          </ThemeText>
        </Pressable>

        <View
          style={[
            styles.heroCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
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
          <ThemeText color="text" style={styles.teamTitle} numberOfLines={2}>
            {team.name}
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.tournamentLine}>
            {tournament.name}
          </ThemeText>
        </View>

        <View
          style={[
            styles.listCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.squadHeaderRow}>
            <ThemeText color="text" style={styles.sectionTitle}>
              Squad
            </ThemeText>
            {canAddNow ? (
              <View style={{ width: widthPixel(140) }}>
                <Button
                  title={players.length === 0 ? 'Add players' : 'Edit squad'}
                  onPress={() => setShowSquadEditor(true)}
                />
              </View>
            ) : null}
          </View>

          {players.length === 0 ? (
            canAddNow ? (
              <ThemeText color="secondaryText" style={styles.emptySquad}>
                No squad members yet. Tap “Add players” to build this team now.
              </ThemeText>
            ) : (
              <ThemeText color="secondaryText" style={styles.emptySquad}>
                Players will be added during the match.
              </ThemeText>
            )
          ) : (
            players.map((p: TeamPlayer, idx: number) => (
              <View
                key={p.id}
                style={[
                  styles.playerRow,
                  idx > 0
                    ? {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: theme.border,
                      }
                    : null,
                ]}
              >
                <ThemeText color="text" style={styles.playerName} numberOfLines={1}>
                  {p.name}
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.playerRole}>
                  {roleLabel(p.role)}
                </ThemeText>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showSquadEditor}
        animationType="slide"
        onRequestClose={() => setShowSquadEditor(false)}
      >
        <AddPlayersToTeamScreen
          teamDisplayName={team.name}
          initialPlayers={players.map<SquadPlayerDraft>(p => ({
            id: p.id,
            name: p.name,
            role: roleToLabel[p.role],
          }))}
          onBack={() => setShowSquadEditor(false)}
          onSaveTeam={squad => {
            dispatch(
              updateTeam({
                id: team.id,
                name: team.name,
                shortName: team.shortName,
                playerAddTiming: (team as any)?.playerAddTiming ?? 'now',
                players: squad.map(p => ({ name: p.name, role: labelToRole[p.role] })),
              }),
            );
            setShowSquadEditor(false);
          }}
        />
      </Modal>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  content: {
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(36),
    width: '100%',
    alignSelf: 'stretch',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: heightPixel(14),
    alignSelf: 'flex-start',
  },
  backChevron: {
    fontSize: fontPixel(22),
    marginRight: widthPixel(2),
    fontFamily: fontFamilies.semibold,
  },
  backRowText: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.semibold,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(18),
    marginBottom: heightPixel(14),
    alignItems: 'center',
  },
  avatar: {
    width: widthPixel(56),
    height: widthPixel(56),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightPixel(12),
  },
  avatarText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  teamTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
    textAlign: 'center',
  },
  tournamentLine: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(12),
    textAlign: 'center',
  },
  listCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(16),
    alignSelf: 'stretch',
    minWidth: 0,
  },
  squadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(12),
    marginBottom: heightPixel(10),
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  emptySquad: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: heightPixel(12),
    gap: widthPixel(10),
  },
  playerName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  playerRole: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.medium,
  },
  missing: {
    flex: 1,
    paddingTop: heightPixel(40),
    paddingHorizontal: widthPixel(20),
    alignItems: 'center',
  },
  title: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  },
  sub: {
    marginTop: heightPixel(10),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
    textAlign: 'center',
  },
  backLink: {
    marginTop: heightPixel(20),
  },
  backText: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
});

export default TournamentTeamSquadScreen;
