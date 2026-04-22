import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, ScrollView, StyleSheet, View } from 'react-native';
import {
  addStrikerAndBowlerInnings,
  beginSuperOver,
  completeMatchIfNeeded,
  completeSuperOverIfNeeded,
  recordBall,
  resolveTieAsDraw,
  setActiveModal,
  setNextBatsman,
  setNextBowler,
  setScoringPaused,
  startSecondInnings,
  startSuperOverSecondInnings,
  undoLastBall,
} from '../../../features/match/matchSlice';
import { heightPixel, widthPixel } from '../../../utils/constants';
import { useDispatch, useSelector } from 'react-redux';
import {
  applyFixtureSlotPatches,
  completeFixture,
} from '../../../features/tournament/tournamentSlice';
import { computeKnockoutFillFromGroupStage } from '../../../features/tournament/tournamentBracketSync';
import { store } from '../../../features/store/store';
import type { RootState } from '../../../features/store/rootReducer';

import BatsmenBowlerCard from '../../../components/Cards/BatsmenBowlerCard';
import BatsmenBowlerScorringHeader from '../../../components/Headers/BatsmenScorringHeader';
import Batsmenrow from '../../../components/Flatlistcomponents/Batsmenrow';
import Bowlerow from '../../../components/Flatlistcomponents/BowlerRow';
import ScoreControls from '../../../components/Flatlistcomponents/ScoreControls';
import ScoringHeader from '../../../components/Headers/ScoringHeader';
import { colors } from '../../../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../../theme/themeContext';
import TieResolutionModal from '../../../components/Modals/TieResolutionModal';
import { recomputeInningsFromBalls } from '../../../utils/recomputeFromBalls';
import EditOversModal from '../../../components/Modals/EditOversModal';
import MatchSettingsModal from '../../../components/Modals/MatchSettingsModal';
import { deleteBall, editBall } from '../../../features/match/matchSlice';

const MatchScoring = () => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { currentMatch, lastCompletedMatch } = useSelector(
    (state: any) => state.match,
  );
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  /** Prevents duplicate navigate for the same completed match (Strict Mode / re-renders). */
  const summaryHandoffForMatchIdRef = useRef<string | null>(null);
  /** Auto-open OPENERS only once per innings start until set. */
  const openersPromptedRef = useRef(false);
  const openersStartStepRef = useRef<'BATTERS' | 'BOWLER'>('BATTERS');

  const innings = useMemo(() => {
    if (!currentMatch) return undefined;
    const ci = currentMatch.currentInnings ?? 1;

    // Tie modal after main innings, or after a tied Super Over: show main innings context (not a stale SO card).
    if (currentMatch.pendingTieResolution) {
      const so1 = currentMatch.superOverInnings1;
      const so2 = currentMatch.superOverInnings2;
      if (so1?.isCompleted && so2?.isCompleted) {
        return currentMatch.innings2 ?? currentMatch.innings1;
      }
      if (!so1) {
        return currentMatch.innings2 ?? currentMatch.innings1;
      }
    }

    if (ci === 1) return currentMatch.innings1;
    if (ci === 2) return currentMatch.innings2;
    if (ci === 3) return currentMatch.superOverInnings1 ?? undefined;
    if (ci === 4) return currentMatch.superOverInnings2 ?? undefined;
    return currentMatch.innings2 ?? currentMatch.innings1;
  }, [currentMatch]);

  const inningsKey = useMemo(() => {
    if (!currentMatch) return null;
    const ci = currentMatch.currentInnings ?? 1;
    if (ci === 1) return 'innings1' as const;
    if (ci === 2) return 'innings2' as const;
    if (ci === 3) return 'superOverInnings1' as const;
    if (ci === 4) return 'superOverInnings2' as const;
    return 'innings1' as const;
  }, [currentMatch?.currentInnings, currentMatch]);

  const computed = useMemo(() => {
    if (!currentMatch || !inningsKey) return null;
    return recomputeInningsFromBalls(currentMatch, inningsKey);
  }, [currentMatch, inningsKey]);

  const superOverAlsoTied = useMemo(() => {
    if (!currentMatch?.pendingTieResolution) return false;
    const so1 = currentMatch.superOverInnings1;
    const so2 = currentMatch.superOverInnings2;
    if (!so1?.isCompleted || !so2?.isCompleted) return false;
    const ra =
      (so1.battingTeam === 'teamA' ? so1.totalRuns : 0) +
      (so2.battingTeam === 'teamA' ? so2.totalRuns : 0);
    const rb =
      (so1.battingTeam === 'teamB' ? so1.totalRuns : 0) +
      (so2.battingTeam === 'teamB' ? so2.totalRuns : 0);
    return ra === rb;
  }, [currentMatch]);

  const activeModal = innings?.activeModal ?? null;
  const [showEditOvers, setShowEditOvers] = useState(false);
  const [showMatchSettings, setShowMatchSettings] = useState(false);

  const battingTeamObj =
    innings?.battingTeam === 'teamA'
      ? currentMatch?.teamA
      : currentMatch?.teamB;

  const bowlingTeamObj =
    innings?.bowlingTeam === 'teamA'
      ? currentMatch?.teamA
      : currentMatch?.teamB;

  const needOpeners =
    innings?.strikerId == null ||
    innings?.nonStrikerId == null ||
    innings?.bowlerId == null;

  const isPaused = currentMatch?.isScoringPaused ?? false;
  const ballCount = innings?.balls?.length ?? 0;

  const isReady =
    !!currentMatch && !!innings && !!currentMatch.teamA && !!currentMatch.teamB;

  const showTieModal = !!(
    currentMatch?.pendingTieResolution && currentMatch?.isScoringPaused
  );

  const isInningsStart = (innings?.balls?.length ?? 0) === 0;
  const needOpenersAtStart =
    innings?.strikerId == null || innings?.nonStrikerId == null;

  useEffect(() => {
    if (currentMatch) {
      summaryHandoffForMatchIdRef.current = null;
      return;
    }
    // Match just finished: summary effect navigates away — do not goBack() or we
    // double-tear-down the screen while Modals are unmounting (Android Fabric crash).
    if (lastCompletedMatch) return;
    navigation.goBack();
  }, [currentMatch, lastCompletedMatch, navigation]);

  useEffect(() => {
    if (!currentMatch) return;
    if (currentMatch.isCompleted) return;
    if (currentMatch.pendingTieResolution) return;
    const bothInningsDone =
      !!currentMatch.innings1?.isCompleted &&
      !!currentMatch.innings2?.isCompleted;
    if (bothInningsDone) return;

    if (!innings) return;
    if (innings.isCompleted) return;

    if (!needOpenersAtStart) {
      openersPromptedRef.current = false;
      return;
    }
    if (isInningsStart && needOpenersAtStart && innings.activeModal == null) {
      if (openersPromptedRef.current) return;
      openersPromptedRef.current = true;
      dispatch(setActiveModal('OPENERS'));
    }
  }, [
    dispatch,
    currentMatch,
    currentMatch?.isCompleted,
    innings?.isCompleted,
    innings?.activeModal,
    isInningsStart,
    needOpenersAtStart,
  ]);

  useEffect(() => {
    if (!currentMatch) return;
    if (currentMatch.currentInnings !== 1) return;

    if (currentMatch.innings1?.isCompleted) {
      dispatch(startSecondInnings());
    }
  }, [
    dispatch,
    currentMatch?.currentInnings,
    currentMatch?.innings1?.isCompleted,
  ]);

  useEffect(() => {
    if (!currentMatch) return;

    const bothDone =
      !!currentMatch.innings1?.isCompleted &&
      !!currentMatch.innings2?.isCompleted;

    if (bothDone) {
      dispatch(completeMatchIfNeeded());
    }
  }, [
    dispatch,
    currentMatch?.innings1?.isCompleted,
    currentMatch?.innings2?.isCompleted,
  ]);

  useEffect(() => {
    if (!currentMatch) return;
    if (currentMatch.currentInnings !== 3) return;
    if (!currentMatch.superOverInnings1?.isCompleted) return;
    dispatch(startSuperOverSecondInnings());
  }, [
    dispatch,
    currentMatch?.currentInnings,
    currentMatch?.superOverInnings1?.isCompleted,
  ]);

  useEffect(() => {
    if (!currentMatch) return;
    if (!currentMatch.superOverInnings1?.isCompleted) return;
    if (!currentMatch.superOverInnings2?.isCompleted) return;
    dispatch(completeSuperOverIfNeeded());
  }, [
    dispatch,
    currentMatch?.superOverInnings1?.isCompleted,
    currentMatch?.superOverInnings2?.isCompleted,
  ]);

  useEffect(() => {
    if (currentMatch || !lastCompletedMatch) return;
    const id = lastCompletedMatch.matchId;
    if (!id) return;

    const matchSnapshot = lastCompletedMatch;

    const runHandoff = () => {
      if (summaryHandoffForMatchIdRef.current === id) return;
      summaryHandoffForMatchIdRef.current = id;

      if (matchSnapshot.tournamentId && matchSnapshot.fixtureId) {
        const winnerName = matchSnapshot.winnerTeamName ?? '';
        let resultSummary =
          matchSnapshot.resultReason === 'TIE'
            ? 'Match tied'
            : matchSnapshot.resultReason === 'NO_RESULT'
              ? 'No result'
              : winnerName
                ? `${winnerName} won`
                : 'Result saved';
        if (matchSnapshot.tieResolvedBy === 'super_over' && winnerName) {
          resultSummary = `${winnerName} won (Super Over)`;
        } else if (matchSnapshot.tieResolvedBy === 'super_over_tied') {
          resultSummary = 'Match tied (Super Over tied)';
        }
        const winnerTeamId = (() => {
          if (!matchSnapshot.winnerTeam) return null;
          if (matchSnapshot.winnerTeam === 'teamA') {
            const id = matchSnapshot.teamA?.id;
            return id != null ? String(id) : null;
          }
          const id = matchSnapshot.teamB?.id;
          return id != null ? String(id) : null;
        })();

        dispatch(
          completeFixture({
            tournamentId: matchSnapshot.tournamentId,
            fixtureId: matchSnapshot.fixtureId,
            status:
              matchSnapshot.resultReason === 'NO_RESULT'
                ? 'no_result'
                : 'completed',
            resultSummary,
            winnerTeamId,
          }),
        );

        const st = store.getState() as RootState;
        const patches = computeKnockoutFillFromGroupStage(st, matchSnapshot.tournamentId);
        if (patches.length) {
          dispatch(
            applyFixtureSlotPatches({
              tournamentId: matchSnapshot.tournamentId,
              patches,
            }),
          );
        }
      }
      // One tap "View summary" on Matches (or back stack); avoids extra auto-navigation.
      navigation.goBack();
    };

    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(runHandoff);
    });
  }, [currentMatch, lastCompletedMatch, navigation, dispatch]);

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]} />
    );
  }

  const safeInnings = innings!;
  const safeBattingTeamObj = battingTeamObj!;
  const safeBowlingTeamObj = bowlingTeamObj!;

  const headerInningsChip =
    currentMatch.pendingTieResolution &&
    currentMatch.superOverInnings1?.isCompleted &&
    currentMatch.superOverInnings2?.isCompleted
      ? 2
      : currentMatch.currentInnings ?? 1;

  const tieBreakJustFinished =
    !!currentMatch.pendingTieResolution &&
    !!currentMatch.superOverInnings1?.isCompleted &&
    !!currentMatch.superOverInnings2?.isCompleted;

  const useInningsBallsOnlyStats =
    (currentMatch.currentInnings === 3 ||
      currentMatch.currentInnings === 4) &&
    !tieBreakJustFinished;

  const oversForHeader = tieBreakJustFinished
    ? currentMatch.overs
    : (currentMatch.currentInnings ?? 1) >= 3
      ? 1
      : currentMatch.overs;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScoringHeader
        innings={safeInnings}
        overs={oversForHeader}
        innings1={currentMatch?.innings1}
        currentInnings={headerInningsChip}
        isPaused={isPaused}
        onTogglePause={() => dispatch(setScoringPaused(!isPaused))}
        onOpenMatchSettings={() => setShowMatchSettings(true)}
        computed={computed}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: heightPixel(12) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <BatsmenBowlerScorringHeader title="Batsmen" variant="batting" />
          <Batsmenrow
            innings={safeInnings}
            currentMatch={currentMatch}
            useInningsBallsOnlyStats={useInningsBallsOnlyStats}
            onPressAdd={() => {
              openersStartStepRef.current = 'BATTERS';
              dispatch(setActiveModal('OPENERS'));
            }}
            computed={computed}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <BatsmenBowlerScorringHeader title="Bowler" variant="bowling" />
          <Bowlerow
            innings={safeInnings}
            currentMatch={currentMatch}
            useInningsBallsOnlyStats={useInningsBallsOnlyStats}
            onPressAdd={() => {
              openersStartStepRef.current = 'BOWLER';
              dispatch(setActiveModal('OPENERS'));
            }}
            computed={computed}
          />
        </View>

        {/* "This over" chips are shown in header next to Target */}
      </ScrollView>

      <View
        style={[
          styles.controlsDock,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, heightPixel(10)),
          },
        ]}
      >
        <ScoreControls
          ballEntryDisabled={
            isPaused || needOpeners || currentMatch.pendingTieResolution
          }
          undoDisabled={ballCount === 0}
          onRunPress={runs => dispatch(recordBall({ runsOffBat: runs }))}
          onExtraPick={({ type, value }) => {
            if (type === 'wide') {
              // Wide: extras only (0–6 as picked).
              dispatch(recordBall({ extra: 'wide', extraRuns: value, runsOffBat: 0 }));
              return;
            }
            if (type === 'noball') {
              // No-ball: 1 extra + optional runs off bat (batsman runs).
              dispatch(recordBall({ extra: 'noball', extraRuns: 1, runsOffBat: value as any }));
              return;
            }
            // Bye/Leg-bye: all runs are extras.
            dispatch(recordBall({ extra: type, extraRuns: value, runsOffBat: 0 }));
          }}
          onWicketPress={() => dispatch(recordBall({ wicket: true }))}
          onUndoPress={() => dispatch(undoLastBall())}
          onEndOverPress={() => {}}
          onEditOversPress={() => setShowEditOvers(true)}
        />
      </View>

      <BatsmenBowlerCard
        presentation="modal"
        innings={innings}
        currentMatch={currentMatch}
        mode="OPENERS"
        batsmen={safeBattingTeamObj.players || []}
        bowler={safeBowlingTeamObj.players || []}
        visible={activeModal === 'OPENERS'}
        openersStartStep={openersStartStepRef.current}
        onClose={() => {
          dispatch(setActiveModal(null));
        }}
        onConfirmOpeners={({ striker, nonStriker, bowlerSelected }) => {
          dispatch(
            addStrikerAndBowlerInnings({
              strikerId: Number(striker.id),
              nonStrikerId: Number(nonStriker.id),
              bowlerId: Number(bowlerSelected.id),
            }),
          );
          dispatch(setActiveModal(null));
        }}
      />

      <BatsmenBowlerCard
        presentation="modal"
        innings={innings}
        currentMatch={currentMatch}
        mode="NEXT_BATSMAN"
        batsmen={safeBattingTeamObj.players || []}
        bowler={safeBowlingTeamObj.players || []}
        visible={activeModal === 'NEXT_BATSMAN'}
        onClose={() => dispatch(setActiveModal(null))}
        onConfirmNextBatsman={b => {
          dispatch(setNextBatsman({ batsmanId: Number(b.id) }));
        }}
      />

      <BatsmenBowlerCard
        presentation="modal"
        innings={innings}
        currentMatch={currentMatch}
        mode="NEXT_BOWLER"
        batsmen={safeBattingTeamObj.players || []}
        bowler={safeBowlingTeamObj.players || []}
        visible={activeModal === 'NEXT_BOWLER'}
        onClose={() => dispatch(setActiveModal(null))}
        onConfirmNextBowler={b => {
          dispatch(setNextBowler({ bowlerId: Number(b.id) }));
        }}
      />

      <TieResolutionModal
        visible={showTieModal}
        teamAName={currentMatch.teamA?.name ?? 'Team A'}
        teamBName={currentMatch.teamB?.name ?? 'Team B'}
        superOverAlsoTied={superOverAlsoTied}
        onChooseDraw={() => dispatch(resolveTieAsDraw())}
        onChooseSuperOver={() => dispatch(beginSuperOver())}
      />

      {inningsKey && innings ? (
        <EditOversModal
          visible={showEditOvers}
          onClose={() => setShowEditOvers(false)}
          inningsKey={inningsKey}
          balls={innings.balls ?? []}
          onEditBall={(ballIndex, patch) =>
            dispatch(editBall({ inningsKey, ballIndex, patch }))
          }
          onDeleteBall={ballIndex => dispatch(deleteBall({ inningsKey, ballIndex }))}
        />
      ) : null}

      <MatchSettingsModal
        visible={showMatchSettings}
        onClose={() => setShowMatchSettings(false)}
        teamAName={currentMatch.teamA?.name ?? 'Team A'}
        teamBName={currentMatch.teamB?.name ?? 'Team B'}
      />
    </View>
  );
};

export default MatchScoring;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: widthPixel(12),
    paddingTop: heightPixel(12),
  },
  card: {
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: heightPixel(12),
    overflow: 'hidden',
  },
  controlsDock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: heightPixel(6),
  },
});
