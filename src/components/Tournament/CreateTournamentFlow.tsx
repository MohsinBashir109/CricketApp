import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ThemeText from '../ThemeText';
import CreateTournamentStepper from './CreateTournamentStepper';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';
import { players, throphy } from '../../assets/images';
import {
  clearConfirmChooseTeamsResult,
  clearTournamentStructureResult,
} from '../../features/tournament/tournamentSlice';
import { TournamentDraftGroup, TournamentFormatType } from '../../types/TournamentTypes';
import { routes } from '../../utils/routes';
import type { RootState } from '../../features/store/rootReducer';

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

/** Keep step labels/order in sync with structure/review screens (Structure = 2, Review = 3). */
const WIZARD_STEPS = [
  'Create tournament',
  'Choose teams',
  'Structure',
  'Review',
] as const;

type Props = {
  /** Used to navigate to tournament details after save. */
  navigation: any;
  /** When false, renders nothing (parent supplies the create CTA). */
  expanded: boolean;
};

const CreateTournamentFlow: React.FC<Props> = ({ navigation, expanded }) => {
  const dispatch = useDispatch();
  const confirmChooseTeamsResult = useSelector(
    (s: RootState) => s.tournament.confirmChooseTeamsResult ?? null,
  );
  const tournamentStructureResult = useSelector(
    (s: RootState) => s.tournament.tournamentStructureResult ?? null,
  );
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  // Step 1: basic fields
  const [name, setName] = useState('');
  const [teamCountInput, setTeamCountInput] = useState('');

  // Step 2: choose teams (full-screen stack route)
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
    if (confirmChooseTeamsResult == null) return;
    setSelectedTeamIds(Array.from(new Set([...confirmChooseTeamsResult])));
    setTeamsConfirmed(true);
    dispatch(clearConfirmChooseTeamsResult());
  }, [confirmChooseTeamsResult, dispatch]);

  useEffect(() => {
    if (tournamentStructureResult == null) return;
    setFormatType(tournamentStructureResult.formatType);
    setGroupCountInput(tournamentStructureResult.groupCountInput);
    setGroupsPreview(tournamentStructureResult.groupsPreview);
    setGroupSeed(tournamentStructureResult.groupSeed);
    setGeneratedSignature(tournamentStructureResult.generatedSignature);
    dispatch(clearTournamentStructureResult());
  }, [tournamentStructureResult, dispatch]);

  const groupsReady =
    formatType === 'groupBased'
      ? groupCount >= 1 &&
        groupCount <= selectedTeamIds.length &&
        groupsPreview.length > 0 &&
        generatedSignature === signature
      : true;

  /**
   * This screen is always the "Create tournament" hub. When teams are confirmed, do not drive
   * the stepper to step 4 (that makes every circle look filled after popping back from review).
   */
  const stepperActiveIndex =
    teamsConfirmed && selectionComplete ? 0 : !basicValid ? 0 : 1;

  if (!expanded) {
    return null;
  }

  const accent = theme.accent;
  const iconTint = accent;

  return (
    <View>
      <CreateTournamentStepper
        steps={WIZARD_STEPS}
        activeIndex={stepperActiveIndex}
        isDark={isDark}
        theme={theme}
      />

      <ThemeText color="text" style={styles.heroTitle}>
        Create tournament
      </ThemeText>
      <ThemeText color="secondaryText" style={styles.heroSubtitle}>
        Fill in the basics, then choose teams.
      </ThemeText>
      <View style={[styles.goldAccent, { backgroundColor: accent }]} />

      <View
        style={[
          styles.formCard,
          isDark ? styles.formCardShadowDark : styles.formCardShadowLight,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelRow}>
            <Image
              source={throphy}
              style={styles.fieldIcon}
              resizeMode="contain"
              tintColor={iconTint}
            />
            <ThemeText color="text" style={styles.fieldLabel}>
              Tournament name
            </ThemeText>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Summer Cup"
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
        </View>

        <View style={styles.fieldBlock}>
          <View style={styles.fieldLabelRow}>
            <Image
              source={players}
              style={styles.fieldIcon}
              resizeMode="contain"
              tintColor={iconTint}
            />
            <ThemeText color="text" style={styles.fieldLabel}>
              Number of teams
            </ThemeText>
          </View>
          <TextInput
            value={teamCountInput}
            onChangeText={setTeamCountInput}
            keyboardType="number-pad"
            placeholder="e.g. 4"
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
          <ThemeText color="secondaryText" style={styles.fieldHelper}>
            Enter how many teams will participate (at least three).
          </ThemeText>
        </View>

        <Pressable
          onPress={() =>
            basicValid &&
            navigation.navigate(routes.chooseTeamsForTournament, {
              teamCount,
              selectedTeamIds,
              tournamentName: normalizedTournamentName,
            })
          }
          disabled={!basicValid}
          style={({ pressed }) => [
            styles.primaryCta,
            { backgroundColor: theme.primary, opacity: !basicValid ? 0.45 : pressed ? 0.92 : 1 },
          ]}
        >
          <ThemeText color="white" style={styles.primaryCtaText}>
            {teamsConfirmed ? 'Edit teams' : 'Next: Choose teams'}
          </ThemeText>
          <ThemeText color="white" style={styles.primaryCtaChevron}>
            ›
          </ThemeText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formCardShadowLight: cardShadowSm(false),
  formCardShadowDark: cardShadowSm(true),
  heroTitle: {
    fontSize: fontPixel(24),
    fontFamily: fontFamilies.bold,
    marginTop: heightPixel(2),
  },
  heroSubtitle: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(21),
    fontFamily: fontFamilies.medium,
  },
  goldAccent: {
    width: widthPixel(40),
    height: heightPixel(3),
    borderRadius: widthPixel(2),
    marginTop: heightPixel(10),
    marginBottom: heightPixel(16),
  },
  formCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(18),
    marginBottom: heightPixel(8),
  },
  fieldBlock: {
    marginBottom: heightPixel(14),
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(10),
    marginBottom: heightPixel(8),
  },
  fieldIcon: {
    width: widthPixel(20),
    height: widthPixel(20),
  },
  fieldLabel: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.bold,
  },
  fieldHelper: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  primaryCta: {
    marginTop: heightPixel(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: widthPixel(8),
    minHeight: heightPixel(52),
    borderRadius: widthPixel(14),
    paddingHorizontal: widthPixel(18),
  },
  primaryCtaText: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.semibold,
  },
  primaryCtaChevron: {
    fontSize: fontPixel(22),
    fontFamily: fontFamilies.bold,
    marginTop: -heightPixel(2),
  },
  input: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(12),
    fontSize: fontPixel(15),
    marginBottom: 0,
  },
});

export default CreateTournamentFlow;

