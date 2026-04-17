import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/themeButton';
import {
  createGroupingSeed,
  generateBalancedGroups,
  getBalancedGroupSizes,
} from '../../../features/tournament/grouping';
import { selectActiveTeams } from '../../../features/tournament/tournamentSelectors';
import { createTournament } from '../../../features/tournament/tournamentSlice';
import { addTeam } from '../../../features/teams/teamsSlice';
import { useThemeContext } from '../../../theme/themeContext';
import { PlayerRole } from '../../../types/Playertype';
import {
  TournamentCompetitionType,
  TournamentDraftGroup,
  TournamentFormatType,
} from '../../../types/TournamentTypes';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { routes } from '../../../utils/routes';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import ThemeText from '../../../components/ThemeText';

type DraftPlayer = {
  id: string;
  name: string;
  role: PlayerRole;
};

const competitionOptions: {
  label: string;
  value: TournamentCompetitionType;
}[] = [
  { label: 'League', value: 'league' },
  { label: 'Cup', value: 'cup' },
  { label: 'Custom', value: 'custom' },
];

const formatOptions: { label: string; value: TournamentFormatType }[] = [
  { label: 'Group-Based Tournament', value: 'groupBased' },
  { label: 'Open Tournament', value: 'open' },
];

const roleOptions: { label: string; value: PlayerRole }[] = [
  { label: 'Batsman', value: 'batsman' },
  { label: 'Bowler', value: 'bowler' },
  { label: 'All-Rounder', value: 'allrounder' },
  { label: 'Wicketkeeper', value: 'wicketkeeper' },
];

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

const CreateTournamentScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const teams = useSelector(selectActiveTeams);
  const { isDark } = useThemeContext();
  const themeColors = colors[isDark ? 'dark' : 'light'];

  const [name, setName] = useState('');
  const [competitionType, setCompetitionType] =
    useState<TournamentCompetitionType>('league');
  const [teamCountInput, setTeamCountInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [formatType, setFormatType] = useState<TournamentFormatType>('open');
  const [groupCountInput, setGroupCountInput] = useState('');
  const [groupsPreview, setGroupsPreview] = useState<TournamentDraftGroup[]>([]);
  const [groupSeed, setGroupSeed] = useState<string | null>(null);
  const [generatedSignature, setGeneratedSignature] = useState<string | null>(null);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShortName, setNewTeamShortName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState<PlayerRole>('batsman');
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);

  const teamCount = Number.parseInt(teamCountInput, 10) || 0;
  const groupCount = Number.parseInt(groupCountInput, 10) || 0;
  const currentSignature = useMemo(
    () =>
      JSON.stringify({
        selectedTeamIds: [...selectedTeamIds].sort(),
        formatType,
        groupCount,
      }),
    [selectedTeamIds, formatType, groupCount],
  );

  const filteredTeams = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return teams;
    return teams.filter(team =>
      team.name.toLowerCase().includes(normalizedQuery),
    );
  }, [teams, searchQuery]);

  const selectedTeams = useMemo(
    () => teams.filter(team => selectedTeamIds.includes(team.id)),
    [teams, selectedTeamIds],
  );

  const isSelectionComplete =
    teamCount > 1 && selectedTeamIds.length === teamCount;
  const isGroupingFresh =
    formatType === 'open' || !!groupsPreview.length && generatedSignature === currentSignature;

  useEffect(() => {
    if (formatType === 'open') {
      setGroupCountInput('');
      setGroupsPreview([]);
      setGroupSeed(null);
      setGeneratedSignature(null);
    }
  }, [formatType]);

  useEffect(() => {
    if (generatedSignature && generatedSignature !== currentSignature) {
      setGroupsPreview([]);
      setGroupSeed(null);
      setGeneratedSignature(null);
    }
  }, [currentSignature, generatedSignature]);

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeamIds(current => {
      if (current.includes(teamId)) {
        return current.filter(id => id !== teamId);
      }
      if (teamCount > 0 && current.length >= teamCount) {
        return current;
      }
      return [...current, teamId];
    });
  };

  const handleAddDraftPlayer = () => {
    const normalizedPlayerName = normalizeName(playerName);
    if (!normalizedPlayerName) {
      Alert.alert('Missing player', 'Enter a player name before adding.');
      return;
    }
    const duplicate = draftPlayers.some(
      player => player.name.toLowerCase() === normalizedPlayerName.toLowerCase(),
    );
    if (duplicate) {
      Alert.alert('Duplicate player', 'This player is already in the team draft.');
      return;
    }

    setDraftPlayers(current => [
      ...current,
      {
        id: makeId('draft-player'),
        name: normalizedPlayerName,
        role: playerRole,
      },
    ]);
    setPlayerName('');
    setPlayerRole('batsman');
  };

  const handleSaveTeam = () => {
    const normalizedTeamName = normalizeName(newTeamName);
    if (!normalizedTeamName) {
      Alert.alert('Missing team name', 'Enter a team name before saving.');
      return;
    }
    if (draftPlayers.length === 0) {
      Alert.alert('Add players', 'Create at least one player for the new team.');
      return;
    }
    const duplicateTeam = teams.some(
      team => team.name.trim().toLowerCase() === normalizedTeamName.toLowerCase(),
    );
    if (duplicateTeam) {
      Alert.alert('Duplicate team', 'A saved team with this name already exists.');
      return;
    }

    const nextTeamId = makeId('team');
    dispatch(
      addTeam({
        id: nextTeamId,
        name: normalizedTeamName,
        shortName: normalizeName(newTeamShortName),
        players: draftPlayers.map(player => ({
          name: player.name,
          role: player.role,
        })),
      }),
    );

    setShowAddTeam(false);
    setNewTeamName('');
    setNewTeamShortName('');
    setDraftPlayers([]);
    setPlayerName('');
    setPlayerRole('batsman');

    if (teamCount > 0 && selectedTeamIds.length < teamCount) {
      setSelectedTeamIds(current =>
        current.includes(nextTeamId) ? current : [...current, nextTeamId],
      );
    }
  };

  const handleGenerateGroups = () => {
    if (!isSelectionComplete) {
      Alert.alert(
        'Complete team selection',
        'Select exactly the number of teams entered before generating groups.',
      );
      return;
    }
    if (groupCount < 1 || groupCount > selectedTeamIds.length) {
      Alert.alert(
        'Invalid groups',
        'Group count must be at least 1 and cannot exceed the selected team count.',
      );
      return;
    }

    const seed = createGroupingSeed();
    const groups = generateBalancedGroups({
      teamIds: selectedTeamIds,
      groupCount,
      seed,
    });
    setGroupsPreview(groups);
    setGroupSeed(seed);
    setGeneratedSignature(currentSignature);
  };

  const handleSaveTournament = () => {
    const normalizedTournamentName = normalizeName(name);
    if (!normalizedTournamentName) {
      Alert.alert('Missing name', 'Tournament name is required.');
      return;
    }
    if (teamCount <= 1) {
      Alert.alert('Invalid team count', 'Tournament must have more than 1 team.');
      return;
    }
    if (!isSelectionComplete) {
      Alert.alert(
        'Incomplete selection',
        'Selected teams must exactly match the team count.',
      );
      return;
    }
    if (new Set(selectedTeamIds).size !== selectedTeamIds.length) {
      Alert.alert('Duplicate team', 'The same team cannot be selected twice.');
      return;
    }
    if (formatType === 'groupBased') {
      if (groupCount < 1 || groupCount > selectedTeamIds.length) {
        Alert.alert(
          'Invalid group count',
          'Group-based tournaments cannot have more groups than teams.',
        );
        return;
      }
      if (!isGroupingFresh) {
        Alert.alert(
          'Generate groups',
          'Generate or regenerate balanced groups before saving.',
        );
        return;
      }
    }

    const tournamentId = makeId('tournament');
    dispatch(
      createTournament({
        id: tournamentId,
        name: normalizedTournamentName,
        competitionType,
        formatType,
        teamCount,
        selectedTeamIds,
        groupCount: formatType === 'groupBased' ? groupCount : null,
        seed: formatType === 'groupBased' ? groupSeed : null,
        groups: formatType === 'groupBased' ? groupsPreview : [],
      }),
    );

    navigation.replace(routes.tournamentDetails, { tournamentId });
  };

  const groupSizePreview =
    formatType === 'groupBased' &&
    groupCount > 0 &&
    groupCount <= Math.max(selectedTeamIds.length, 1)
      ? getBalancedGroupSizes(selectedTeamIds.length || teamCount, groupCount).join(
          ' - ',
        )
      : null;

  return (
    <HomeWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <ThemeText color="text" style={styles.screenTitle}>
            Create Tournament
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.screenText}>
            Build a realistic tournament structure with strict selection
            validation, open or grouped format, and fair random grouping.
          </ThemeText>

          <ThemeText color="text" style={styles.label}>
            Tournament Name
          </ThemeText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Summer Cricket Cup"
            placeholderTextColor={themeColors.secondaryText}
            style={[
              styles.input,
              {
                color: themeColors.text,
                borderColor: themeColors.border,
                backgroundColor: themeColors.surfaceElevated,
              },
            ]}
          />

          <ThemeText color="text" style={styles.label}>
            Tournament Type
          </ThemeText>
          <View style={styles.optionWrap}>
            {competitionOptions.map(option => {
              const selected = competitionType === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setCompetitionType(option.value)}
                  style={[
                    styles.choiceChip,
                    {
                      borderColor: selected
                        ? themeColors.primary
                        : themeColors.border,
                      backgroundColor: selected
                        ? themeColors.primaryMuted
                        : themeColors.surface,
                    },
                  ]}
                >
                  <ThemeText color={selected ? 'primary' : 'text'} style={styles.choiceText}>
                    {option.label}
                  </ThemeText>
                </Pressable>
              );
            })}
          </View>

          <ThemeText color="text" style={styles.label}>
            Number Of Teams
          </ThemeText>
          <TextInput
            value={teamCountInput}
            onChangeText={setTeamCountInput}
            keyboardType="number-pad"
            placeholder="Enter team count"
            placeholderTextColor={themeColors.secondaryText}
            style={[
              styles.input,
              {
                color: themeColors.text,
                borderColor: themeColors.border,
                backgroundColor: themeColors.surfaceElevated,
              },
            ]}
          />
          <ThemeText color="secondaryText" style={styles.helperText}>
            Team count must be greater than 1 and exactly match selected teams.
          </ThemeText>
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
          <View style={styles.inlineRow}>
            <View style={{ flex: 1 }}>
              <ThemeText color="text" style={styles.sectionTitle}>
                Select Teams
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.helperText}>
                Selected {selectedTeamIds.length} of {teamCount || 0} teams
              </ThemeText>
            </View>
            <Pressable onPress={() => setShowAddTeam(current => !current)}>
              <ThemeText color="primary" style={styles.linkText}>
                {showAddTeam ? 'Close Team Builder' : 'Add Team'}
              </ThemeText>
            </Pressable>
          </View>

          {showAddTeam ? (
            <View
              style={[
                styles.innerCard,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.surfaceElevated,
                },
              ]}
            >
              <ThemeText color="text" style={styles.innerTitle}>
                New Team
              </ThemeText>
              <TextInput
                value={newTeamName}
                onChangeText={setNewTeamName}
                placeholder="Team name"
                placeholderTextColor={themeColors.secondaryText}
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                  },
                ]}
              />
              <TextInput
                value={newTeamShortName}
                onChangeText={setNewTeamShortName}
                placeholder="Short name (optional)"
                placeholderTextColor={themeColors.secondaryText}
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                  },
                ]}
              />

              <ThemeText color="text" style={styles.label}>
                Add Players
              </ThemeText>
              <TextInput
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="Player name"
                placeholderTextColor={themeColors.secondaryText}
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                  },
                ]}
              />
              <View style={styles.optionWrap}>
                {roleOptions.map(option => {
                  const selected = playerRole === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setPlayerRole(option.value)}
                      style={[
                        styles.choiceChip,
                        {
                          borderColor: selected
                            ? themeColors.primary
                            : themeColors.border,
                          backgroundColor: selected
                            ? themeColors.primaryMuted
                            : themeColors.surface,
                        },
                      ]}
                    >
                      <ThemeText
                        color={selected ? 'primary' : 'text'}
                        style={styles.choiceText}
                      >
                        {option.label}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </View>
              <Button title="Add Player" onPress={handleAddDraftPlayer} />

              {draftPlayers.map(player => (
                <View
                  key={player.id}
                  style={[
                    styles.listRow,
                    { borderBottomColor: themeColors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ThemeText color="text" style={styles.listTitle}>
                      {player.name}
                    </ThemeText>
                    <ThemeText color="secondaryText" style={styles.listMeta}>
                      {player.role}
                    </ThemeText>
                  </View>
                  <Pressable
                    onPress={() =>
                      setDraftPlayers(current =>
                        current.filter(item => item.id !== player.id),
                      )
                    }
                  >
                    <ThemeText color="error" style={styles.linkText}>
                      Remove
                    </ThemeText>
                  </Pressable>
                </View>
              ))}
              <Button title="Save Team To Repository" onPress={handleSaveTeam} />
            </View>
          ) : null}

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved teams"
            placeholderTextColor={themeColors.secondaryText}
            style={[
              styles.input,
              {
                color: themeColors.text,
                borderColor: themeColors.border,
                backgroundColor: themeColors.surfaceElevated,
              },
            ]}
          />

          {teams.length === 0 ? (
            <ThemeText color="secondaryText" style={styles.helperText}>
              No saved teams yet. Add a team first to use it in this tournament.
            </ThemeText>
          ) : null}

          {filteredTeams.map(team => {
            const selected = selectedTeamIds.includes(team.id);
            const maxReached = teamCount > 0 && selectedTeamIds.length >= teamCount;
            const disabled = !selected && maxReached;
            return (
              <Pressable
                key={team.id}
                onPress={() => !disabled && toggleTeamSelection(team.id)}
                style={[
                  styles.teamCard,
                  {
                    borderColor: selected ? themeColors.primary : themeColors.border,
                    backgroundColor: selected
                      ? themeColors.primaryMuted
                      : themeColors.surface,
                    opacity: disabled ? 0.5 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <ThemeText color="text" style={styles.listTitle}>
                    {team.name}
                  </ThemeText>
                  <ThemeText color="secondaryText" style={styles.listMeta}>
                    {team.players.length} players
                    {team.shortName ? ` • ${team.shortName}` : ''}
                  </ThemeText>
                </View>
                <ThemeText color={selected ? 'primary' : 'secondaryText'} style={styles.selectState}>
                  {selected ? 'Selected' : disabled ? 'Full' : 'Select'}
                </ThemeText>
              </Pressable>
            );
          })}
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
            Tournament Structure
          </ThemeText>
          <View style={styles.optionWrap}>
            {formatOptions.map(option => {
              const selected = formatType === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setFormatType(option.value)}
                  style={[
                    styles.structureCard,
                    {
                      borderColor: selected
                        ? themeColors.primary
                        : themeColors.border,
                      backgroundColor: selected
                        ? themeColors.primaryMuted
                        : themeColors.surface,
                    },
                  ]}
                >
                  <ThemeText color={selected ? 'primary' : 'text'} style={styles.listTitle}>
                    {option.label}
                  </ThemeText>
                  <ThemeText color="secondaryText" style={styles.listMeta}>
                    {option.value === 'groupBased'
                      ? 'Create balanced random groups like Group A, Group B, Group C.'
                      : 'Keep all selected teams in one common tournament pool.'}
                  </ThemeText>
                </Pressable>
              );
            })}
          </View>

          {formatType === 'groupBased' ? (
            <>
              <ThemeText color="text" style={styles.label}>
                Number Of Groups
              </ThemeText>
              <TextInput
                value={groupCountInput}
                onChangeText={setGroupCountInput}
                keyboardType="number-pad"
                placeholder="Enter group count"
                placeholderTextColor={themeColors.secondaryText}
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surfaceElevated,
                  },
                ]}
              />
              <ThemeText color="secondaryText" style={styles.helperText}>
                Group count cannot exceed selected teams. Balanced sizes preview:
                {groupSizePreview ? ` ${groupSizePreview}` : ' waiting for valid numbers'}.
              </ThemeText>
              <Button
                title={groupsPreview.length > 0 ? 'Regenerate Groups' : 'Generate Groups'}
                onPress={handleGenerateGroups}
                disabled={!isSelectionComplete || groupCount < 1}
              />
            </>
          ) : (
            <ThemeText color="secondaryText" style={styles.helperText}>
              All selected teams will stay in one open tournament pool.
            </ThemeText>
          )}
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
            Review
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.helperText}>
            {selectedTeams.length} selected teams
          </ThemeText>
          {selectedTeams.map(team => (
            <View
              key={team.id}
              style={[styles.listRow, { borderBottomColor: themeColors.border }]}
            >
              <ThemeText color="text" style={styles.listTitle}>
                {team.name}
              </ThemeText>
            </View>
          ))}

          {formatType === 'groupBased' && groupsPreview.length > 0 ? (
            groupsPreview.map(group => (
              <View
                key={group.name}
                style={[
                  styles.groupCard,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surfaceElevated,
                  },
                ]}
              >
                <ThemeText color="text" style={styles.listTitle}>
                  {group.name}
                </ThemeText>
                {group.teamIds.map(teamId => {
                  const team = teams.find(item => item.id === teamId);
                  return (
                    <ThemeText key={teamId} color="secondaryText" style={styles.listMeta}>
                      {team?.name ?? 'Unknown team'}
                    </ThemeText>
                  );
                })}
              </View>
            ))
          ) : null}

          <Button
            title="Save Tournament"
            onPress={handleSaveTournament}
            disabled={
              !normalizeName(name) ||
              teamCount <= 1 ||
              !isSelectionComplete ||
              (formatType === 'groupBased' && !isGroupingFresh)
            }
          />
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
  sectionCard: {
    borderWidth: 1,
    borderRadius: widthPixel(20),
    padding: widthPixel(16),
    marginBottom: heightPixel(14),
  },
  screenTitle: {
    fontSize: fontPixel(24),
    fontFamily: fontFamilies.bold,
  },
  screenText: {
    marginTop: heightPixel(8),
    marginBottom: heightPixel(16),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(21),
  },
  sectionTitle: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
  },
  label: {
    marginTop: heightPixel(14),
    marginBottom: heightPixel(8),
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
  input: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(14),
    fontSize: fontPixel(15),
    marginBottom: heightPixel(10),
  },
  helperText: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(10),
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
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
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: widthPixel(10),
    marginBottom: heightPixel(12),
  },
  linkText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  innerCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
    marginBottom: heightPixel(14),
  },
  innerTitle: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.bold,
    marginBottom: heightPixel(8),
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(12),
    paddingVertical: heightPixel(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  teamCard: {
    borderWidth: 1,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
    marginBottom: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(10),
  },
  structureCard: {
    flexBasis: '100%',
    borderWidth: 1,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
  },
  listTitle: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.semibold,
  },
  listMeta: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  selectState: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.bold,
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
    marginBottom: heightPixel(10),
  },
});

export default CreateTournamentScreen;
