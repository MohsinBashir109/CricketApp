import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';

import HomeWrapper from '../../../wrappers/HomeWrapper';
import ThemeText from '../../../components/ThemeText';
import ThemeInput from '../../../components/ThemeInput';
import Button from '../../../components/themeButton';
import { backarrow } from '../../../assets/images';

import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowSm } from '../../../utils/cardShadow';
import { useThemeContext } from '../../../theme/themeContext';
import { routes } from '../../../utils/routes';
import { setmatch } from '../../../features/match/matchSlice';
import type { MatchSetup, Player } from '../../../types/Playertype';
import { withGloballyUniquePlayerIds } from '../../../utils/matchSetup';

type StepKey = 'format' | 'teams' | 'lineups' | 'toss' | 'review';

type TossStep = 'winner' | 'choice';

const initialsFromName = (name: string) => {
  const t = (name ?? '').trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
};


const StartMatchWizard = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const [activeStep, setActiveStep] = useState<StepKey>('format');

  const [addDuringMatchMode, setAddDuringMatchMode] = useState(false);

  const [match, setMatch] = useState<MatchSetup>({
    matchId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    teamA: { id: 1, name: '', players: [] },
    teamB: { id: 2, name: '', players: [] },
    overs: null,
    electedTo: '',
    tossWinner: '',
    currentInnings: null,
    tossWinnerName: '',
    innings1: null,
    innings2: null,
    isCompleted: false,
    resultReason: 'NO_RESULT',
    winnerTeam: null,
    winnerTeamName: '',
  });

  const [customOvers, setCustomOvers] = useState('');
  const [showCustomOvers, setShowCustomOvers] = useState(false);

  const [tossStep, setTossStep] = useState<TossStep>('winner');
  const [tossWinnerDraft, setTossWinnerDraft] = useState<'teamA' | 'teamB' | null>(null);

  // tournament preset support (filled in todo #2; we still initialize essentials here)
  useEffect(() => {
    const preset = route.params?.presetMatch;
    if (!preset) return;

    const presetTeamA = preset.teamA;
    const presetTeamB = preset.teamB;
    const presetOvers = preset.overs ?? null;
    const presetPlayersPerTeam = preset.playersPerTeam ?? null;
    const presetMatchId = preset.matchId;
    if (!presetMatchId || !presetTeamA || !presetTeamB) return;

    setAddDuringMatchMode(
      presetTeamA?.playerAddTiming === 'during_match' ||
        presetTeamB?.playerAddTiming === 'during_match',
    );

    setMatch(prev => ({
      ...prev,
      matchId: presetMatchId,
      tournamentId: preset.tournamentId,
      fixtureId: preset.fixtureId,
      playersPerTeam: presetPlayersPerTeam,
      sourceTeamAId: presetTeamA.id,
      sourceTeamBId: presetTeamB.id,
      overs: presetOvers,
      teamA: {
        id: 1,
        name: presetTeamA.name,
        players: (presetTeamA.players ?? []).map((p: any) => ({
          id: 0,
          name: p.name,
          role: p.role,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          overs: 0,
          maidens: 0,
          conceded: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
        })),
      },
      teamB: {
        id: 2,
        name: presetTeamB.name,
        players: (presetTeamB.players ?? []).map((p: any) => ({
          id: 0,
          name: p.name,
          role: p.role,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          overs: 0,
          maidens: 0,
          conceded: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
        })),
      },
    }));

    // If overs are preset, start at Teams or Lineups depending on names.
    if (presetOvers && presetOvers > 0) {
      setActiveStep('teams');
    }
  }, [route.params?.presetMatch]);

  const isPresetOversLocked =
    route.params?.presetMatch?.overs != null &&
    Number(route.params?.presetMatch?.overs) > 0;

  const arePresetTeamsLocked =
    !!route.params?.presetMatch?.teamA?.name && !!route.params?.presetMatch?.teamB?.name;

  const hasPresetSquads =
    (route.params?.presetMatch?.teamA?.players?.length ?? 0) > 0 &&
    (route.params?.presetMatch?.teamB?.players?.length ?? 0) > 0;

  // Receive squad updates from AddPlayersToTeam screen
  useEffect(() => {
    const payload = route.params?.squadForTeam;
    if (!payload?.teamKey || !Array.isArray(payload.players)) return;
    const teamKey = payload.teamKey as 'teamA' | 'teamB';
    const players = payload.players as Player[];

    setMatch(prev => {
      const team = prev[teamKey];
      if (!team) return prev;
      return { ...prev, [teamKey]: { ...team, players } };
    });

    navigation.setParams({ squadForTeam: undefined });
  }, [route.params?.squadForTeam, navigation]);

  const done = useMemo(() => {
    const oversOk = typeof match.overs === 'number' && match.overs > 0;
    const teamsOk = (match.teamA?.name ?? '').trim() && (match.teamB?.name ?? '').trim();
    const aCount = match.teamA?.players?.length ?? 0;
    const bCount = match.teamB?.players?.length ?? 0;
    const lineupsOk = addDuringMatchMode ? true : aCount > 0 && bCount > 0;
    const tossOk = !!match.tossWinner && !!match.electedTo;
    return {
      format: oversOk,
      teams: !!teamsOk,
      lineups: lineupsOk,
      toss: tossOk,
      review: oversOk && !!teamsOk && lineupsOk && tossOk,
    };
  }, [match, addDuringMatchMode]);

  // Auto-advance step for preset matches (no surprises; only advances forward).
  useEffect(() => {
    if (!route.params?.presetMatch) return;
    if (!done.format) return;
    if (!done.teams) return;
    if (activeStep === 'format' && done.format) setActiveStep('teams');
    if (activeStep === 'teams' && done.teams) setActiveStep('lineups');
    if (
      activeStep === 'lineups' &&
      (addDuringMatchMode || hasPresetSquads || done.lineups)
    ) {
      setActiveStep('toss');
    }
  }, [
    route.params?.presetMatch,
    done.format,
    done.teams,
    done.lineups,
    activeStep,
    addDuringMatchMode,
    hasPresetSquads,
  ]);

  const onBack = () => {
    const order: StepKey[] = ['format', 'teams', 'lineups', 'toss', 'review'];
    const idx = order.indexOf(activeStep);
    if (idx <= 0) {
      navigation.goBack();
      return;
    }
    setActiveStep(order[idx - 1]);
  };

  const selectOvers = (overs: number) => {
    setMatch(prev => ({ ...prev, overs }));
    setShowCustomOvers(false);
    setCustomOvers('');
    setActiveStep('teams');
  };

  const openTeamPlayers = (teamKey: 'teamA' | 'teamB') => {
    const team = teamKey === 'teamA' ? match.teamA : match.teamB;
    navigation.navigate(routes.addPlayersToTeam, {
      teamKey,
      teamDisplayName: team?.name || (teamKey === 'teamA' ? 'Team A' : 'Team B'),
      initialPlayers: team?.players ?? [],
    });
  };

  const canOpenToss = useMemo(() => {
    if (addDuringMatchMode) return true;
    const a = match.teamA?.players?.length ?? 0;
    const b = match.teamB?.players?.length ?? 0;
    return a > 0 && b > 0;
  }, [addDuringMatchMode, match.teamA?.players?.length, match.teamB?.players?.length]);

  const initInnings = (battingTeam: 'teamA' | 'teamB', bowlingTeam: 'teamA' | 'teamB') => {
    const btName = battingTeam === 'teamA' ? match.teamA?.name ?? '' : match.teamB?.name ?? '';
    const bwName = bowlingTeam === 'teamA' ? match.teamA?.name ?? '' : match.teamB?.name ?? '';
    return {
      battingTeam,
      bowlingTeam,
      battingTeamName: btName,
      bowlingTeamName: bwName,
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      strikerId: null,
      nonStrikerId: null,
      bowlerId: null,
      balls: [],
      activeModal: null,
      outTarget: 'STRIKER' as const,
      pendingBowlerChange: false,
      isCompleted: false,
    };
  };

  const confirmToss = (electedTo: 'bat' | 'bowl') => {
    if (!tossWinnerDraft) return;
    const tossWinner = tossWinnerDraft;
    const tossWinnerName = tossWinner === 'teamA' ? match.teamA?.name ?? '' : match.teamB?.name ?? '';
    const battingTeam =
      electedTo === 'bat' ? tossWinner : tossWinner === 'teamA' ? 'teamB' : 'teamA';
    const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';

    setMatch(prev => ({
      ...prev,
      tossWinner,
      electedTo,
      currentInnings: 1,
      tossWinnerName,
      innings1: initInnings(battingTeam, bowlingTeam) as any,
      innings2: initInnings(bowlingTeam, battingTeam) as any,
    }));

    setTossStep('winner');
    setTossWinnerDraft(null);
    setActiveStep('review');
  };

  const startMatch = () => {
    const payload = withGloballyUniquePlayerIds(match);
    dispatch(setmatch(payload));
    navigation.replace(routes.matchscoring as never);
  };

  const title = (() => {
    if (activeStep === 'format') return 'Start Match';
    if (activeStep === 'teams') return 'Build Team Lineups';
    if (activeStep === 'lineups') return 'Build Team Lineups';
    if (activeStep === 'toss') return 'Build Team Lineups';
    return 'Start Match';
  })();

  const secondaryButtonStyle = useMemo(
    () => ({
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: 'transparent',
      elevation: 0,
    }),
    [theme.border],
  );

  return (
    <HomeWrapper headerShown={false} backButtonShown={false}>
      <View style={styles.root}>
        <View
          style={[
            styles.topBar,
            {
              backgroundColor: 'transparent',
              borderBottomColor: theme.border,
            },
          ]}
        >
          <Pressable hitSlop={16} onPress={onBack} style={styles.backHit}>
            <Image source={backarrow} style={styles.backIcon} tintColor={theme.text} />
          </Pressable>
          <ThemeText color="text" style={styles.topTitle} numberOfLines={1}>
            {title}
          </ThemeText>
          <View style={styles.topRight} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentInner}>
          {activeStep === 'format' ? (
          <>
            <ThemeText color="text" style={styles.screenTitle}>
              Choose match format
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.screenSub}>
              Pick overs to set the pace.
            </ThemeText>

            <View style={styles.tileGrid}>
              {[
                { label: 'T10', sub: 'Quick play', value: 10 },
                { label: 'T20', sub: 'Most popular', value: 20 },
                { label: 'T50', sub: 'Classic', value: 50 },
                { label: 'Custom', sub: 'Set overs', value: 0 },
              ].map(t => {
                const selected = (match.overs ?? 0) === t.value && t.value !== 0;
                const disabled = isPresetOversLocked;
                return (
                  <Pressable
                    key={t.label}
                    onPress={() => {
                      if (disabled) return;
                      if (t.value === 0) {
                        setShowCustomOvers(true);
                        return;
                      }
                      selectOvers(t.value);
                    }}
                    style={({ pressed }) => [
                      styles.tile,
                      {
                        backgroundColor: theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <ThemeText color="text" style={styles.tileLabel}>
                      {t.label}
                    </ThemeText>
                    <ThemeText color="secondaryText" style={styles.tileSub}>
                      {t.sub}
                    </ThemeText>
                  </Pressable>
                );
              })}
            </View>

            <Modal
              visible={showCustomOvers}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCustomOvers(false)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex1}
              >
                <View style={styles.modalWrap}>
                  <Pressable style={styles.backdrop} onPress={() => setShowCustomOvers(false)} />
                  <View
                    style={[
                      styles.modalCard,
                      isDark ? styles.cardShadowDark : styles.cardShadowLight,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <ThemeText color="text" style={styles.modalTitle}>
                      Custom overs
                    </ThemeText>
                    <ThemeText color="secondaryText" style={styles.modalSub}>
                      Enter overs (e.g. 12)
                    </ThemeText>
                    <ThemeInput
                      title="Overs"
                      placeholder="Number of overs"
                      value={customOvers}
                      onChangeText={setCustomOvers}
                      keyboardType="number-pad"
                    />
                    <Button
                      title="Use this length"
                      disabled={!(Number(customOvers) > 0)}
                      onPress={() => {
                        const o = Number(customOvers);
                        if (!Number.isFinite(o) || o <= 0) return;
                        selectOvers(o);
                      }}
                    />
                    <Pressable onPress={() => setShowCustomOvers(false)} style={styles.modalCancel}>
                      <ThemeText color="secondaryText" style={styles.modalCancelText}>
                        Cancel
                      </ThemeText>
                    </Pressable>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>

            <View style={styles.navRow}>
              <Button title="Next" disabled={!done.format} onPress={() => setActiveStep('teams')} />
            </View>
          </>
        ) : null}

        {activeStep === 'teams' ? (
          <>
            <ThemeText color="text" style={styles.screenTitle}>
              Team names
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.screenSub}>
              Set both teams to continue.
            </ThemeText>
            <ThemeInput
              title="Team A"
              placeholder="Enter Team A name"
              value={match.teamA?.name ?? ''}
              onChangeText={t =>
                setMatch(prev => ({
                  ...prev,
                  teamA: { ...(prev.teamA as any), name: t },
                }))
              }
              editable={!arePresetTeamsLocked}
            />
            <ThemeInput
              title="Team B"
              placeholder="Enter Team B name"
              value={match.teamB?.name ?? ''}
              onChangeText={t =>
                setMatch(prev => ({
                  ...prev,
                  teamB: { ...(prev.teamB as any), name: t },
                }))
              }
              editable={!arePresetTeamsLocked}
            />
            <View style={styles.navRow}>
              <Button
                title="Back"
                bgColor="transparent"
                textColor="text"
                buttonStyle={secondaryButtonStyle}
                onPress={() => setActiveStep('format')}
              />
              <Button title="Next" disabled={!done.format || !done.teams} onPress={() => setActiveStep('lineups')} />
            </View>
          </>
        ) : null}

        {activeStep === 'lineups' ? (
          <>
            <ThemeText color="text" style={styles.screenTitle}>
              Build team lineups
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.screenSub}>
              {addDuringMatchMode
                ? 'This match allows adding players during scoring.'
                : 'Add players for both teams to continue.'}
            </ThemeText>
            <View style={styles.teamCardRow}>
              {(['teamA', 'teamB'] as const).map(k => {
                const team = k === 'teamA' ? match.teamA : match.teamB;
                const name =
                  team?.name?.trim() || (k === 'teamA' ? 'Team A' : 'Team B');
                const count = team?.players?.length ?? 0;
                return (
                  <Pressable
                    key={k}
                    onPress={() => openTeamPlayers(k)}
                    style={({ pressed }) => [
                      styles.teamCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                      <ThemeText color="white" style={styles.badgeText}>
                        {initialsFromName(name)}
                      </ThemeText>
                    </View>
                    <View style={styles.teamMeta}>
                      <ThemeText color="text" style={styles.teamName} numberOfLines={1}>
                        {name}
                      </ThemeText>
                      <ThemeText color="secondaryText" style={styles.teamHint}>
                        {count > 0 ? `${count} players added` : 'No players yet'}
                      </ThemeText>
                    </View>
                    <ThemeText color="secondaryText" style={styles.chev}>
                      ›
                    </ThemeText>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.navRow}>
              <Button
                title="Back"
                bgColor="transparent"
                textColor="text"
                buttonStyle={secondaryButtonStyle}
                onPress={() => setActiveStep('teams')}
              />
              <Button
                title="Next"
                disabled={!done.format || !done.teams || !canOpenToss}
                onPress={() => setActiveStep('toss')}
              />
            </View>
          </>
        ) : null}

        {activeStep === 'toss' ? (
          <>
            <ThemeText color="text" style={styles.screenTitle}>
              Toss
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.screenSub}>
              Select toss winner and choose bat or bowl.
            </ThemeText>
            {tossStep === 'winner' ? (
              <View>
                {(['teamA', 'teamB'] as const).map(k => {
                  const tm = k === 'teamA' ? match.teamA : match.teamB;
                  const name =
                    tm?.name?.trim() || (k === 'teamA' ? 'Team A' : 'Team B');
                  return (
                    <Pressable
                      key={k}
                      onPress={() => {
                        setTossWinnerDraft(k);
                        setTossStep('choice');
                      }}
                      style={({ pressed }) => [
                        styles.tossPickRow,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.badgeSm, { backgroundColor: theme.primary }]}>
                        <ThemeText color="white" style={styles.badgeTextSm}>
                          {initialsFromName(name)}
                        </ThemeText>
                      </View>
                      <View style={styles.teamMeta}>
                        <ThemeText color="text" style={styles.teamName} numberOfLines={1}>
                          {name}
                        </ThemeText>
                        <ThemeText color="secondaryText" style={styles.teamHint}>
                          Tap to set as toss winner
                        </ThemeText>
                      </View>
                      <ThemeText color="secondaryText" style={styles.chev}>
                        ›
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View>
                <View style={styles.choiceRow}>
                  <Pressable
                    onPress={() => confirmToss('bat')}
                    style={({ pressed }) => [
                      styles.choiceBtn,
                      { backgroundColor: theme.primary, opacity: pressed ? 0.92 : 1 },
                    ]}
                  >
                    <ThemeText color="white" style={styles.choiceText}>
                      Bat
                    </ThemeText>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmToss('bowl')}
                    style={({ pressed }) => [
                      styles.choiceBtn,
                      { backgroundColor: theme.primary, opacity: pressed ? 0.92 : 1 },
                    ]}
                  >
                    <ThemeText color="white" style={styles.choiceText}>
                      Bowl
                    </ThemeText>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => {
                    setTossStep('winner');
                    setTossWinnerDraft(null);
                  }}
                  style={styles.linkBtn}
                >
                  <ThemeText color="primary" style={styles.linkText}>
                    ← Change toss winner
                  </ThemeText>
                </Pressable>
              </View>
            )}
            <View style={styles.navRow}>
              <Button
                title="Back"
                bgColor="transparent"
                textColor="text"
                buttonStyle={secondaryButtonStyle}
                onPress={() => setActiveStep('lineups')}
              />
              <Button title="Next" disabled={!done.toss} onPress={() => setActiveStep('review')} />
            </View>
          </>
        ) : null}

        {activeStep === 'review' ? (
          <>
            <ThemeText color="text" style={styles.screenTitle}>
              Ready to play
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.screenSub}>
              Check details, then start scoring.
            </ThemeText>

            <View style={styles.reviewPlain}>
              {[
                { k: 'Format', v: match.overs ? `T${match.overs}` : '—' },
                { k: 'Teams', v: `${match.teamA?.name || '—'} vs ${match.teamB?.name || '—'}` },
                { k: 'Toss', v: match.tossWinnerName ? `${match.tossWinnerName} · ${match.electedTo}` : '—' },
              ].map(row => (
                <View key={row.k} style={styles.reviewPlainRow}>
                  <ThemeText color="secondaryText" style={styles.reviewPlainLabel}>
                    {row.k}
                  </ThemeText>
                  <ThemeText color="text" style={styles.reviewPlainValue} numberOfLines={2}>
                    {row.v}
                  </ThemeText>
                </View>
              ))}
            </View>

            <Button title="Start match" disabled={!done.review} onPress={startMatch} />
            <Button
              title="Back"
              bgColor="transparent"
              textColor="text"
              buttonStyle={secondaryButtonStyle}
              onPress={() => setActiveStep('toss')}
            />
          </>
        ) : null}
          </View>
        </ScrollView>
      </View>
    </HomeWrapper>
  );
};

export default StartMatchWizard;

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  root: { flex: 1, width: '100%', backgroundColor: 'transparent' },
  content: {
    paddingTop: heightPixel(14),
    paddingBottom: heightPixel(24),
  },
  contentInner: {
    width: '100%',
    alignSelf: 'center',
  },
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(16),
    marginTop: heightPixel(8),
  },
  backHit: {
    paddingRight: widthPixel(10),
    paddingVertical: heightPixel(6),
  },
  backIcon: {
    width: widthPixel(22),
    height: heightPixel(22),
  },
  topTitle: {
    flex: 1,
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    textAlign: 'center',
  },
  topRight: {
    width: widthPixel(32),
  },
  screenTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(22),
    letterSpacing: -0.2,
    marginTop: heightPixel(6),
  },
  screenSub: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    lineHeight: fontPixel(18),
    marginTop: heightPixel(6),
    marginBottom: heightPixel(14),
  },
  navRow: {
    marginTop: heightPixel(12),
    gap: heightPixel(10),
  },

  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
  },
  tile: {
    width: '48%',
    borderRadius: widthPixel(16),
    borderWidth: 1,
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(12),
  },
  tileLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  tileSub: {
    marginTop: heightPixel(4),
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(12),
  },

  teamCardRow: {
    gap: heightPixel(10),
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
  },
  badge: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
    letterSpacing: 0.6,
  },
  badgeSm: {
    width: widthPixel(40),
    height: widthPixel(40),
    borderRadius: widthPixel(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTextSm: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(13),
    letterSpacing: 0.6,
  },
  teamMeta: {
    flex: 1,
    marginLeft: widthPixel(12),
    minWidth: 0,
  },
  teamName: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  teamHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    marginTop: heightPixel(4),
  },
  chev: {
    fontSize: fontPixel(20),
    marginTop: -heightPixel(2),
  },

  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  sectionSub: {
    marginTop: heightPixel(6),
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(12),
  },
  tossPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
    marginBottom: heightPixel(10),
  },
  choiceRow: {
    flexDirection: 'row',
    gap: widthPixel(12),
    marginTop: heightPixel(10),
  },
  choiceBtn: {
    flex: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(16),
    alignItems: 'center',
  },
  choiceText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  linkBtn: {
    marginTop: heightPixel(14),
    alignSelf: 'center',
    paddingVertical: heightPixel(8),
  },
  linkText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  reviewPlain: {
    marginBottom: heightPixel(12),
    gap: heightPixel(12),
  },
  reviewPlainRow: {},
  reviewPlainLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reviewPlainValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(15),
    marginTop: heightPixel(4),
  },

  modalWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: widthPixel(16),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalCard: {
    borderRadius: widthPixel(18),
    borderWidth: 1,
    padding: widthPixel(16),
  },
  modalTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  modalSub: {
    marginTop: heightPixel(6),
    marginBottom: heightPixel(8),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  modalCancel: {
    alignSelf: 'center',
    paddingVertical: heightPixel(10),
  },
  modalCancelText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});

