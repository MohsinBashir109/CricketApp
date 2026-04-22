import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ThemeText from '../ThemeText';
import Button from '../themeButton';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { selectActiveTeams } from '../../features/tournament/tournamentSelectors';
import {
  clearPickFromSavedTeamsResult,
  createTournament,
} from '../../features/tournament/tournamentSlice';
import type { RootState } from '../../features/store/rootReducer';
import {
  createGroupingSeed,
  generateBalancedGroups,
  getBalancedGroupSizes,
} from '../../features/tournament/grouping';
import { TournamentDraftGroup, TournamentFormatType } from '../../types/TournamentTypes';
import ChooseTeamsModal from '../Modals/ChooseTeamsModal';
import { routes } from '../../utils/routes';

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

const formatOptions: { label: string; value: TournamentFormatType }[] = [
  { label: 'Multiple Groups', value: 'groupBased' },
  { label: 'Open Group', value: 'open' },
];

type Props = {
  /** Used to navigate to tournament details after save. */
  navigation: any;
  /** When false, renders nothing (parent supplies the create CTA). */
  expanded: boolean;
  /** Optional callback to collapse after save/cancel. */
  onCollapse?: () => void;
};

const CreateTournamentFlow: React.FC<Props> = ({ navigation, expanded, onCollapse }) => {
  const dispatch = useDispatch();
  const teams = useSelector(selectActiveTeams);
  const pickFromSavedResult = useSelector(
    (s: RootState) => s.tournament.pickFromSavedTeamsResult ?? null,
  );
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  // Step 1: basic fields
  const [name, setName] = useState('');
  const [teamCountInput, setTeamCountInput] = useState('');

  // Step 2: choose teams modal
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [teamsConfirmed, setTeamsConfirmed] = useState(false);

  // Step 3: structure
  const [formatType, setFormatType] = useState<TournamentFormatType>('open');
  const [groupCountInput, setGroupCountInput] = useState('');
  const [groupsPreview, setGroupsPreview] = useState<TournamentDraftGroup[]>([]);
  const [groupSeed, setGroupSeed] = useState<string | null>(null);
  const [generatedSignature, setGeneratedSignature] = useState<string | null>(null);

  const teamCount = Number.parseInt(teamCountInput, 10) || 0;
  const groupCount = Number.parseInt(groupCountInput, 10) || 0;

  const normalizedTournamentName = useMemo(() => normalizeName(name), [name]);
  const basicValid = normalizedTournamentName.length > 0 && teamCount >= 3;

  const selectedTeams = useMemo(
    () => teams.filter(t => selectedTeamIds.includes(t.id)),
    [teams, selectedTeamIds],
  );

  const selectionComplete = teamCount >= 3 && selectedTeamIds.length === teamCount;

  const signature = useMemo(
    () =>
      JSON.stringify({
        selectedTeamIds: [...selectedTeamIds].sort(),
        formatType,
        groupCount,
      }),
    [selectedTeamIds, formatType, groupCount],
  );

  // If user changes inputs that invalidate later steps, reset progressively.
  useEffect(() => {
    if (!expanded) return;
    if (!basicValid) {
      setTeamsConfirmed(false);
      setSelectedTeamIds([]);
      setTeamsModalOpen(false);
      setFormatType('open');
      setGroupCountInput('');
      setGroupsPreview([]);
      setGroupSeed(null);
      setGeneratedSignature(null);
      return;
    }
    // If team count drops below selected, trim selection and invalidate confirmation.
    if (teamCount >= 3 && selectedTeamIds.length > teamCount) {
      setSelectedTeamIds(prev => prev.slice(0, teamCount));
      setTeamsConfirmed(false);
    }
  }, [expanded, basicValid, teamCount, selectedTeamIds.length]);

  useEffect(() => {
    if (formatType === 'open') {
      setGroupCountInput('');
      setGroupsPreview([]);
      setGroupSeed(null);
      setGeneratedSignature(null);
    }
  }, [formatType]);

  useEffect(() => {
    if (generatedSignature && generatedSignature !== signature) {
      setGroupsPreview([]);
      setGroupSeed(null);
      setGeneratedSignature(null);
    }
  }, [generatedSignature, signature]);

  useEffect(() => {
    if (!expanded) setTeamsModalOpen(false);
  }, [expanded]);

  useEffect(() => {
    if (pickFromSavedResult == null) return;
    setSelectedTeamIds(pickFromSavedResult);
    dispatch(clearPickFromSavedTeamsResult());
    setTeamsModalOpen(true);
  }, [pickFromSavedResult, dispatch]);

  const groupSizePreview =
    formatType === 'groupBased' &&
    groupCount > 0 &&
    groupCount <= Math.max(selectedTeamIds.length, 1)
      ? getBalancedGroupSizes(selectedTeamIds.length || teamCount, groupCount).join(' - ')
      : null;

  const handleGenerateGroups = () => {
    if (!teamsConfirmed || !selectionComplete) {
      Alert.alert('Choose teams first', 'Confirm your team selection before generating groups.');
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
    const groups = generateBalancedGroups({ teamIds: selectedTeamIds, groupCount, seed });
    setGroupsPreview(groups);
    setGroupSeed(seed);
    setGeneratedSignature(signature);
  };

  const handleSaveTournament = () => {
    if (!normalizedTournamentName) {
      Alert.alert('Missing name', 'Tournament name is required.');
      return;
    }
    if (teamCount < 3) {
      Alert.alert('Invalid team count', 'Use at least three teams for a proper league schedule.');
      return;
    }
    if (!teamsConfirmed || !selectionComplete) {
      Alert.alert('Choose teams', 'Select and confirm exactly the required number of teams.');
      return;
    }
    if (new Set(selectedTeamIds).size !== selectedTeamIds.length) {
      Alert.alert('Duplicate team', 'The same team cannot be selected twice.');
      return;
    }
    if (formatType === 'groupBased') {
      if (groupCount < 1 || groupCount > selectedTeamIds.length) {
        Alert.alert('Invalid groups', 'Group count must be valid before saving.');
        return;
      }
      if (!groupsPreview.length || generatedSignature !== signature) {
        Alert.alert('Generate groups', 'Generate or regenerate groups before saving.');
        return;
      }
    }

    const tournamentId = `tournament-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    dispatch(
      createTournament({
        id: tournamentId,
        name: normalizedTournamentName,
        competitionType: 'league',
        formatType,
        teamCount,
        selectedTeamIds,
        groupCount: formatType === 'groupBased' ? groupCount : null,
        seed: formatType === 'groupBased' ? groupSeed : null,
        groups: formatType === 'groupBased' ? groupsPreview : [],
        settings: {
          roundRobinLegs: 1,
          knockoutEnabled: true,
          tournamentScheduleFormat: formatType === 'open' ? 'OPEN_GROUP' : 'MULTIPLE_GROUPS',
        },
      }),
    );

    onCollapse?.();
    navigation.replace(routes.tournamentDetails, { tournamentId });
  };

  if (!expanded) {
    return null;
  }

  return (
    <View>
      {/* Step 1 */}
      <ThemeText color="text" style={styles.sectionTitle}>
        Create tournament
      </ThemeText>
      <ThemeText color="secondaryText" style={styles.helperText}>
        Fill in the basics, then choose teams.
      </ThemeText>

      <ThemeText color="text" style={styles.label}>
        Tournament name
      </ThemeText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Summer Cup"
        placeholderTextColor={theme.secondaryText}
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
        ]}
      />

      <ThemeText color="text" style={styles.label}>
        Number of teams
      </ThemeText>
      <TextInput
        value={teamCountInput}
        onChangeText={setTeamCountInput}
        keyboardType="number-pad"
        placeholder="Enter team count"
        placeholderTextColor={theme.secondaryText}
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
        ]}
      />
      <ThemeText color="secondaryText" style={styles.helperText}>
        Enter how many teams will participate.
      </ThemeText>

      {/* Step 2 — only after name + team count are valid */}
      {basicValid ? (
        <View style={styles.stepBlock}>
          <ThemeText color="text" style={styles.stepTitle}>
            Teams
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.helperText}>
            {teamsConfirmed
              ? `${selectedTeamIds.length} of ${teamCount} teams confirmed.`
              : `Choose exactly ${teamCount} teams to continue.`}
          </ThemeText>
          <Button
            title={teamsConfirmed ? 'Edit teams' : 'Next: Choose teams'}
            onPress={() => setTeamsModalOpen(true)}
          />
        </View>
      ) : (
        <ThemeText color="secondaryText" style={styles.helperText}>
          Enter a tournament name and a team count above 1 to continue.
        </ThemeText>
      )}

      <ChooseTeamsModal
        visible={teamsModalOpen}
        teamCount={teamCount}
        selectedTeamIds={selectedTeamIds}
        onClose={() => setTeamsModalOpen(false)}
        onConfirm={ids => {
          setSelectedTeamIds(ids);
          setTeamsConfirmed(true);
          setTeamsModalOpen(false);
        }}
        onOpenSavedTeams={currentIds => {
          setTeamsModalOpen(false);
          navigation.navigate(routes.addFromSavedTeams, {
            teamCount,
            selectedTeamIds: currentIds,
          });
        }}
      />

      {/* Step 3 + 4 gated */}
      {teamsConfirmed && selectionComplete ? (
        <>
          <View style={styles.divider} />

          <ThemeText color="text" style={styles.sectionTitle}>
            Tournament structure
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
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.primaryMuted : theme.surface,
                    },
                  ]}
                >
                  <ThemeText color={selected ? 'primary' : 'text'} style={styles.listTitle}>
                    {option.label}
                  </ThemeText>
                  <ThemeText color="secondaryText" style={styles.listMeta}>
                    {option.value === 'groupBased'
                      ? 'Create balanced groups (Group A, Group B…) before fixtures.'
                      : 'All selected teams stay in one open pool.'}
                  </ThemeText>
                </Pressable>
              );
            })}
          </View>

          {formatType === 'groupBased' ? (
            <>
              <ThemeText color="text" style={styles.label}>
                Number of groups
              </ThemeText>
              <TextInput
                value={groupCountInput}
                onChangeText={setGroupCountInput}
                keyboardType="number-pad"
                placeholder="Enter group count"
                placeholderTextColor={theme.secondaryText}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
                ]}
              />
              <ThemeText color="secondaryText" style={styles.helperText}>
                Balanced sizes: {groupSizePreview ?? 'waiting for valid numbers'}.
              </ThemeText>
              <Button
                title={groupsPreview.length > 0 ? 'Regenerate groups' : 'Generate groups'}
                onPress={handleGenerateGroups}
                disabled={groupCount < 1}
              />
            </>
          ) : null}

          <View style={styles.divider} />

          <ThemeText color="text" style={styles.sectionTitle}>
            Review
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.helperText}>
            {selectedTeams.length} teams selected.
          </ThemeText>
          {selectedTeams.map(t => (
            <ThemeText key={t.id} color="text" style={styles.reviewRow}>
              {t.name}
            </ThemeText>
          ))}

          <Button title="Save tournament" onPress={handleSaveTournament} />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.bold,
    marginTop: heightPixel(6),
  },
  helperText: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginTop: heightPixel(6),
    marginBottom: heightPixel(10),
  },
  label: {
    marginTop: heightPixel(12),
    marginBottom: heightPixel(8),
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  input: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(12),
    fontSize: fontPixel(15),
    marginBottom: heightPixel(6),
  },
  stepBlock: {
    marginTop: heightPixel(10),
    padding: widthPixel(12),
    borderRadius: widthPixel(16),
  },
  stepTitle: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.bold,
  },
  divider: {
    height: heightPixel(12),
  },
  optionWrap: {
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
  reviewRow: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(13),
  },
});

export default CreateTournamentFlow;

