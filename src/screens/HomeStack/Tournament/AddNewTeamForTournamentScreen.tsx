import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowSm } from '../../../utils/cardShadow';
import { selectActiveTeams } from '../../../features/tournament/tournamentSelectors';
import { addTeam } from '../../../features/teams/teamsSlice';
import { PlayerRole } from '../../../types/Playertype';
import { TeamPlayerAddTiming } from '../../../types/TournamentTypes';
import AddPlayersToTeamScreen, {
  type SquadPlayer as SquadPlayerDraft,
  type TeamRoleLabel,
} from '../AddPlayers/AddPlayersToTeamScreen';
import { routes } from '../../../utils/routes';

type DraftPlayer = { id: string; name: string; role: PlayerRole };

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

const playerTimingOptions: { label: string; value: TeamPlayerAddTiming }[] = [
  { label: 'Add player now', value: 'now' },
  { label: 'Add during match', value: 'during_match' },
];

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

const AddNewTeamForTournamentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const teams = useSelector(selectActiveTeams);
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const teamCount = Number(route.params?.teamCount ?? 0) || 0;
  const selectedTeamIds: string[] = route.params?.selectedTeamIds ?? [];
  const tournamentName = String(route.params?.tournamentName ?? '').trim();

  const [newTeamName, setNewTeamName] = useState('');
  const [playerAddTiming, setPlayerAddTiming] = useState<TeamPlayerAddTiming>('now');
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);
  const [showAddPlayersScreen, setShowAddPlayersScreen] = useState(false);

  const handleSave = () => {
    const teamName = normalizeName(newTeamName);
    if (!teamName) {
      Alert.alert('Missing team name', 'Enter a team name before saving.');
      return;
    }
    if (playerAddTiming === 'now' && draftPlayers.length === 0) {
      Alert.alert('Add players', 'Create at least one player for the new team.');
      return;
    }
    if (teams.some(t => t.name.trim().toLowerCase() === teamName.toLowerCase())) {
      Alert.alert('Duplicate team', 'A saved team with this name already exists.');
      return;
    }

    const nextTeamId = `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    dispatch(
      addTeam({
        id: nextTeamId,
        name: teamName,
        players: draftPlayers.map(p => ({ name: p.name, role: p.role })),
        playerAddTiming,
      }),
    );

    const nextIds = [...selectedTeamIds];
    if (!nextIds.includes(nextTeamId) && nextIds.length < teamCount) {
      nextIds.push(nextTeamId);
    }

    navigation.navigate({
      name: routes.chooseTeamsForTournament,
      params: { teamCount, selectedTeamIds: nextIds, tournamentName },
      merge: true,
    });
  };

  return (
    <HomeWrapper headerShown>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemeText color="text" style={styles.title}>
            New team
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.sub}>
            Create a team, then you will return to choose teams with it available to select.
          </ThemeText>

          <TextInput
            value={newTeamName}
            onChangeText={setNewTeamName}
            placeholder="Team name"
            placeholderTextColor={theme.secondaryText}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
            ]}
          />

          <ThemeText color="text" style={styles.label}>
            Add players
          </ThemeText>
          <View style={styles.optionWrap}>
            {playerTimingOptions.map(opt => {
              const selected = playerAddTiming === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPlayerAddTiming(opt.value)}
                  style={[
                    styles.choiceChip,
                    {
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.primaryMuted : theme.surfaceElevated,
                    },
                  ]}
                >
                  <ThemeText color={selected ? 'primary' : 'text'} style={styles.choiceText}>
                    {opt.label}
                  </ThemeText>
                </Pressable>
              );
            })}
          </View>
          {playerAddTiming === 'during_match' ? (
            <ThemeText color="secondaryText" style={styles.timingHint}>
              You can save this team now and add players later during the match.
            </ThemeText>
          ) : null}

          {playerAddTiming === 'now' ? (
            <View style={styles.playersCtaBlock}>
              <Button
                title={draftPlayers.length > 0 ? `Add / edit players (${draftPlayers.length})` : 'Add players'}
                onPress={() => setShowAddPlayersScreen(true)}
              />
              {draftPlayers.length > 0 ? (
                <ThemeText color="secondaryText" style={styles.playersCountHint}>
                  {draftPlayers.length} player{draftPlayers.length === 1 ? '' : 's'} added.
                </ThemeText>
              ) : null}
            </View>
          ) : null}

          <Button title="Save team" onPress={handleSave} />
          <Pressable onPress={() => navigation.goBack()} style={styles.cancelRow}>
            <ThemeText color="secondaryText" style={styles.cancelText}>
              Cancel
            </ThemeText>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showAddPlayersScreen}
        animationType="slide"
        onRequestClose={() => setShowAddPlayersScreen(false)}
      >
        <AddPlayersToTeamScreen
          teamDisplayName={normalizeName(newTeamName) || 'New team'}
          initialPlayers={draftPlayers.map<SquadPlayerDraft>(p => ({
            id: p.id,
            name: p.name,
            role: roleToLabel[p.role],
          }))}
          onBack={() => setShowAddPlayersScreen(false)}
          onSaveTeam={squad => {
            setDraftPlayers(
              squad.map(p => ({
                id: p.id,
                name: normalizeName(p.name),
                role: labelToRole[p.role],
              })),
            );
            setShowAddPlayersScreen(false);
          }}
        />
      </Modal>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  content: {
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(32),
  },
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  card: {
    borderRadius: widthPixel(20),
    borderWidth: 1,
    padding: widthPixel(18),
  },
  title: {
    fontSize: fontPixel(20),
    fontFamily: fontFamilies.bold,
    marginBottom: heightPixel(8),
  },
  sub: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
    marginBottom: heightPixel(16),
  },
  input: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(12),
    fontSize: fontPixel(15),
    marginBottom: heightPixel(12),
  },
  label: {
    marginBottom: heightPixel(8),
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
    marginBottom: heightPixel(10),
  },
  choiceChip: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(14),
  },
  choiceText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  timingHint: {
    marginBottom: heightPixel(10),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  playersCtaBlock: {
    marginBottom: heightPixel(12),
  },
  playersCountHint: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(12),
  },
  cancelRow: {
    marginTop: heightPixel(14),
    alignSelf: 'center',
    paddingVertical: heightPixel(8),
  },
  cancelText: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
});

export default AddNewTeamForTournamentScreen;
