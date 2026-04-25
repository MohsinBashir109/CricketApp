import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackActions, useNavigation, useRoute } from '@react-navigation/native';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import CreateTournamentStepper from '../../../components/Tournament/CreateTournamentStepper';
import TournamentSavedSuccessModal from '../../../components/Tournament/TournamentSavedSuccessModal';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowSm } from '../../../utils/cardShadow';
import { selectActiveTeams } from '../../../features/tournament/tournamentSelectors';
import { createTournament } from '../../../features/tournament/tournamentSlice';
import type { TournamentWizardReviewParams } from '../../../types/TournamentTypes';
import { routes } from '../../../utils/routes';

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

/** Keep labels/order in sync with `CreateTournamentFlow` / `TournamentStructureScreen`. */
const WIZARD_STEPS = [
  'Create tournament',
  'Choose teams',
  'Structure',
  'Review',
] as const;

const REVIEW_STEP_INDEX = 3;

const TournamentReviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const teams = useSelector(selectActiveTeams);
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [savedTournamentId, setSavedTournamentId] = useState<string | null>(null);

  const p = (route.params ?? {}) as Partial<TournamentWizardReviewParams>;
  const tournamentNameRaw = String(p.tournamentName ?? '');
  const teamCount = Number(p.teamCount ?? 0) || 0;
  const selectedTeamIds: string[] = Array.isArray(p.selectedTeamIds) ? p.selectedTeamIds : [];
  const formatType = p.formatType ?? 'open';
  const groupCount = Number(p.groupCount ?? 0) || 0;
  const groupSeed = p.groupSeed ?? null;
  const groupsPreview = Array.isArray(p.groupsPreview) ? p.groupsPreview : [];
  const generatedSignature = p.generatedSignature ?? null;

  const normalizedTournamentName = useMemo(() => normalizeName(tournamentNameRaw), [tournamentNameRaw]);

  const signature = useMemo(
    () =>
      JSON.stringify({
        selectedTeamIds: [...selectedTeamIds].sort(),
        formatType,
        groupCount,
      }),
    [selectedTeamIds, formatType, groupCount],
  );

  const selectionComplete = teamCount >= 3 && selectedTeamIds.length === teamCount;

  const selectedTeams = useMemo(
    () =>
      selectedTeamIds
        .map(id => teams.find(t => t.id === id))
        .filter((t): t is (typeof teams)[number] => t != null),
    [selectedTeamIds, teams],
  );

  const groupsReady =
    formatType === 'groupBased'
      ? groupCount >= 1 &&
        groupCount <= selectedTeamIds.length &&
        groupsPreview.length > 0 &&
        generatedSignature === signature
      : true;

  const paramsOk =
    normalizedTournamentName.length > 0 &&
    teamCount >= 3 &&
    selectionComplete &&
    new Set(selectedTeamIds).size === selectedTeamIds.length &&
    (formatType === 'open' || groupsReady);

  const finishWizardAndNavigate = (tournamentId: string, initialTab?: 'fixtures') => {
    const stackRoutes = navigation.getState()?.routes ?? [];
    const popCount = Math.max(0, stackRoutes.length - 1);
    if (popCount > 0) {
      navigation.dispatch(StackActions.pop(popCount));
    }
    navigation.navigate(routes.tournamentDetails, {
      tournamentId,
      ...(initialTab ? { initialTab } : {}),
    });
  };

  const handleSave = () => {
    if (!normalizedTournamentName) {
      Alert.alert('Missing name', 'Tournament name is required.');
      return;
    }
    if (teamCount < 3) {
      Alert.alert('Invalid team count', 'Use at least three teams for a proper league schedule.');
      return;
    }
    if (!selectionComplete) {
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

    setSavedTournamentId(tournamentId);
    setSuccessModalVisible(true);
  };

  const dismissSuccessModal = () => {
    setSuccessModalVisible(false);
  };

  const handleMoveToFixture = () => {
    const id = savedTournamentId;
    dismissSuccessModal();
    setSavedTournamentId(null);
    if (id) finishWizardAndNavigate(id, 'fixtures');
  };

  const handleSuccessGoToTournament = () => {
    const id = savedTournamentId;
    dismissSuccessModal();
    setSavedTournamentId(null);
    if (id) finishWizardAndNavigate(id);
  };

  if (!paramsOk) {
    return (
      <HomeWrapper headerShown>
        <View style={styles.invalidWrap}>
          <ThemeText color="text" style={styles.invalidTitle}>
            Something went wrong
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.invalidSub}>
            Go back and complete the previous steps (name, teams, and structure if using groups).
          </ThemeText>
          <Button title="Go back" onPress={() => navigation.goBack()} />
        </View>
      </HomeWrapper>
    );
  }

  return (
    <HomeWrapper headerShown>
      <TournamentSavedSuccessModal
        visible={successModalVisible}
        tournamentName={normalizedTournamentName}
        theme={theme}
        isDark={isDark}
        onMoveToFixture={handleMoveToFixture}
        onGoToTournament={handleSuccessGoToTournament}
      />
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
              activeIndex={REVIEW_STEP_INDEX}
              isDark={isDark}
              theme={theme}
            />

            <View style={styles.cardHeader}>
              <ThemeText color="text" style={styles.cardTitle}>
                Review
              </ThemeText>
            </View>

            <ThemeText color="secondaryText" style={styles.intro}>
              Double-check your tournament name and teams, then save to create the tournament.
            </ThemeText>

            <ThemeText color="text" style={styles.nameLabel}>
              Tournament
            </ThemeText>
            <ThemeText color="text" style={styles.nameValue} numberOfLines={2}>
              {normalizedTournamentName}
            </ThemeText>

            <View
              style={[
                styles.reviewCard,
                isDark ? styles.reviewShadowDark : styles.reviewShadowLight,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.reviewHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemeText color="text" style={styles.reviewTitle}>
                    Selected teams
                  </ThemeText>
                  <ThemeText color="secondaryText" style={styles.reviewSub}>
                    {formatType === 'groupBased' ? 'Multiple groups' : 'Open group'} · {teamCount}{' '}
                    teams
                  </ThemeText>
                </View>
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: theme.primaryMuted, borderColor: theme.border },
                  ]}
                >
                  <ThemeText color="primary" style={styles.countPillText}>
                    {selectedTeams.length}
                  </ThemeText>
                </View>
              </View>

              {selectedTeams.map((t, idx) => {
                const count = t.players?.length ?? 0;
                return (
                  <View
                    key={t.id}
                    style={[
                      styles.reviewTeamRow,
                      idx > 0
                        ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }
                        : null,
                    ]}
                  >
                    <ThemeText color="text" style={styles.reviewTeamName} numberOfLines={1}>
                      {t.name}
                    </ThemeText>
                    <ThemeText color="secondaryText" style={styles.reviewTeamMeta}>
                      {count === 0 ? 'No players' : `${count} player${count === 1 ? '' : 's'}`}
                    </ThemeText>
                  </View>
                );
              })}
            </View>

            <View style={styles.saveSpacer} />
            <Button
              title="Save tournament"
              onPress={handleSave}
              disabled={successModalVisible}
            />
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
    marginBottom: heightPixel(10),
  },
  cardTitle: {
    fontSize: fontPixel(22),
    fontFamily: fontFamilies.bold,
  },
  intro: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(20),
    marginBottom: heightPixel(14),
  },
  nameLabel: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.semibold,
    marginBottom: heightPixel(4),
  },
  nameValue: {
    fontSize: fontPixel(17),
    fontFamily: fontFamilies.bold,
    marginBottom: heightPixel(14),
  },
  reviewShadowLight: cardShadowSm(false),
  reviewShadowDark: cardShadowSm(true),
  reviewCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
    marginTop: heightPixel(4),
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
    paddingBottom: heightPixel(10),
  },
  reviewTitle: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.bold,
  },
  reviewSub: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  countPill: {
    minWidth: widthPixel(38),
    paddingHorizontal: widthPixel(12),
    height: heightPixel(34),
    borderRadius: widthPixel(999),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.bold,
  },
  reviewTeamRow: {
    paddingVertical: heightPixel(10),
  },
  reviewTeamName: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
  reviewTeamMeta: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
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

export default TournamentReviewScreen;
