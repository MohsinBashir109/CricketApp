import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowSm } from '../../../utils/cardShadow';
import {
  createGroupingSeed,
  generateBalancedGroups,
  getBalancedGroupSizes,
} from '../../../features/tournament/grouping';
import CreateTournamentStepper from '../../../components/Tournament/CreateTournamentStepper';
import { submitTournamentStructureResult } from '../../../features/tournament/tournamentSlice';
import type {
  TournamentDraftGroup,
  TournamentFormatType,
  TournamentWizardReviewParams,
} from '../../../types/TournamentTypes';
import { routes } from '../../../utils/routes';

const formatOptions: { label: string; value: TournamentFormatType }[] = [
  { label: 'Multiple Groups', value: 'groupBased' },
  { label: 'Open Group', value: 'open' },
];

/** Must match `CreateTournamentFlow` — index 2 is the Structure step. */
const WIZARD_STEPS = [
  'Create tournament',
  'Choose teams',
  'Structure',
  'Review',
] as const;

const STRUCTURE_STEP_INDEX = 2;

type RouteParams = {
  teamCount: number;
  selectedTeamIds: string[];
  /** Carried from create / choose-teams so review can open after Save structure. */
  tournamentName?: string;
  initialFormatType?: TournamentFormatType;
  initialGroupCountInput?: string;
  initialGroupsPreview?: TournamentDraftGroup[];
  initialGroupSeed?: string | null;
  initialGeneratedSignature?: string | null;
};

const TournamentStructureScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const p = (route.params ?? {}) as RouteParams;
  const teamCount = Number(p.teamCount ?? 0) || 0;
  const selectedTeamIds: string[] = Array.isArray(p.selectedTeamIds) ? p.selectedTeamIds : [];

  const [formatType, setFormatType] = useState<TournamentFormatType>(
    p.initialFormatType ?? 'open',
  );
  const [groupCountInput, setGroupCountInput] = useState(p.initialGroupCountInput ?? '');
  const [groupsPreview, setGroupsPreview] = useState<TournamentDraftGroup[]>(
    p.initialGroupsPreview ?? [],
  );
  const [groupSeed, setGroupSeed] = useState<string | null>(p.initialGroupSeed ?? null);
  const [generatedSignature, setGeneratedSignature] = useState<string | null>(
    p.initialGeneratedSignature ?? null,
  );

  const groupCount = Number.parseInt(groupCountInput, 10) || 0;

  const signature = useMemo(
    () =>
      JSON.stringify({
        selectedTeamIds: [...selectedTeamIds].sort(),
        formatType,
        groupCount,
      }),
    [selectedTeamIds, formatType, groupCount],
  );

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

  const groupSizePreview =
    formatType === 'groupBased' &&
    groupCount > 0 &&
    groupCount <= Math.max(selectedTeamIds.length, 1)
      ? getBalancedGroupSizes(selectedTeamIds.length || teamCount, groupCount).join(' - ')
      : null;

  const groupsReady =
    formatType === 'groupBased'
      ? groupCount >= 1 &&
        groupCount <= selectedTeamIds.length &&
        groupsPreview.length > 0 &&
        generatedSignature === signature
      : true;

  const handleGenerateGroups = () => {
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

  const handleSave = () => {
    if (formatType === 'groupBased' && !groupsReady) {
      Alert.alert(
        'Finish group setup',
        'Enter a valid group count and generate groups before saving.',
      );
      return;
    }
    const tournamentName = String(p.tournamentName ?? '').trim();
    if (!tournamentName) {
      Alert.alert(
        'Missing tournament name',
        'Go back to create tournament and enter a name before saving structure.',
      );
      return;
    }
    dispatch(
      submitTournamentStructureResult({
        formatType,
        groupCountInput: formatType === 'open' ? '' : groupCountInput,
        groupsPreview: formatType === 'open' ? [] : groupsPreview,
        groupSeed: formatType === 'open' ? null : groupSeed,
        generatedSignature: formatType === 'open' ? null : generatedSignature,
      }),
    );
    const reviewParams: TournamentWizardReviewParams = {
      tournamentName,
      teamCount,
      selectedTeamIds: [...selectedTeamIds],
      formatType,
      groupCount: formatType === 'open' ? 0 : groupCount,
      groupSeed: formatType === 'open' ? null : groupSeed,
      groupsPreview: formatType === 'open' ? [] : groupsPreview,
      generatedSignature: formatType === 'open' ? null : generatedSignature,
    };
    navigation.navigate(routes.tournamentReview, reviewParams);
  };

  const selectionOk =
    teamCount >= 3 &&
    selectedTeamIds.length === teamCount &&
    new Set(selectedTeamIds).size === selectedTeamIds.length;

  if (!selectionOk) {
    return (
      <HomeWrapper headerShown>
        <View style={styles.invalidWrap}>
          <ThemeText color="text" style={styles.invalidTitle}>
            Something went wrong
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.invalidSub}>
            Go back, confirm your teams on the create tournament screen, then open structure again.
          </ThemeText>
          <Button title="Go back" onPress={() => navigation.goBack()} />
        </View>
      </HomeWrapper>
    );
  }

  return (
    <HomeWrapper headerShown>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.mainCard}>
            <CreateTournamentStepper
              steps={WIZARD_STEPS}
              activeIndex={STRUCTURE_STEP_INDEX}
              isDark={isDark}
              theme={theme}
            />

            <View style={styles.cardHeader}>
              <ThemeText color="text" style={styles.cardTitle}>
                Tournament structure
              </ThemeText>
              <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                <ThemeText color="primary" style={styles.cancelLink}>
                  Back to teams
                </ThemeText>
              </Pressable>
            </View>

            <ThemeText color="secondaryText" style={styles.intro}>
              Choose open pool or multiple groups, then generate the draw if needed. Tap Save
              structure to continue to review and create the tournament.
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
                      isDark ? styles.structureCardShadowDark : styles.structureCardShadowLight,
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
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.surfaceElevated,
                    },
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

            <View style={styles.saveSpacer} />
            <Button title="Save structure" onPress={handleSave} />
          </View>
        </ScrollView>
      </View>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
    marginTop: heightPixel(6),
  },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { paddingBottom: heightPixel(28) },
  mainCard: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(14),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: heightPixel(10),
  },
  cardTitle: {
    fontSize: fontPixel(22),
    fontFamily: fontFamilies.bold,
    flex: 1,
    paddingRight: widthPixel(12),
  },
  cancelLink: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
  intro: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(20),
    marginBottom: heightPixel(16),
  },
  optionWrap: {
    gap: widthPixel(10),
  },
  structureCardShadowLight: cardShadowSm(false),
  structureCardShadowDark: cardShadowSm(true),
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
  label: {
    marginTop: heightPixel(14),
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
    marginBottom: 0,
  },
  helperText: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginTop: heightPixel(6),
    marginBottom: heightPixel(10),
  },
  saveSpacer: { height: heightPixel(20) },
  invalidWrap: {
    flex: 1,
    marginTop: heightPixel(24),
    paddingHorizontal: widthPixel(16),
    gap: heightPixel(12),
  },
  invalidTitle: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
  },
  invalidSub: {
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
    marginBottom: heightPixel(8),
  },
});

export default TournamentStructureScreen;
