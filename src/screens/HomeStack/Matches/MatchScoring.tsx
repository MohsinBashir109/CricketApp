import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  addStrikerAndBowlerInnings,
  completeMatchIfNeeded,
  recordBall,
  setActiveModal,
  setNextBatsman,
  setNextBowler,
  setScoringPaused,
  startSecondInnings,
  undoLastBall,
} from '../../../features/match/matchSlice';
import { heightPixel, widthPixel } from '../../../utils/constants';
import { useDispatch, useSelector } from 'react-redux';
import { completeFixture } from '../../../features/tournament/tournamentSlice';

import BatsmenBowlerCard from '../../../components/Cards/BatsmenBowlerCard';
import BatsmenBowlerScorringHeader from '../../../components/Headers/BatsmenScorringHeader';
import Batsmenrow from '../../../components/Flatlistcomponents/Batsmenrow';
import Bowlerow from '../../../components/Flatlistcomponents/BowlerRow';
import CurrentOver from '../../../components/Cards/CurrentOver';
import ScoreControls from '../../../components/Flatlistcomponents/ScoreControls';
import ScoringHeader from '../../../components/Headers/ScoringHeader';
import { colors } from '../../../utils/colors';
import { routes } from '../../../utils/routes';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../../theme/themeContext';

const MatchScoring = () => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { currentMatch, lastCompletedMatch } = useSelector(
    (state: any) => state.match,
  );
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const innings = useMemo(() => {
    if (!currentMatch) return undefined;
    return currentMatch.currentInnings === 1
      ? currentMatch.innings1
      : currentMatch.innings2;
  }, [currentMatch]);

  const activeModal = innings?.activeModal ?? null;

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

  const isInningsStart = (innings?.balls?.length ?? 0) === 0;
  const needOpenersAtStart =
    innings?.strikerId == null || innings?.nonStrikerId == null;

  useEffect(() => {
    if (!currentMatch) {
      navigation.goBack();
    }
  }, [currentMatch, navigation]);

  useEffect(() => {
    if (!innings) return;
    if (innings.isCompleted) return;

    if (isInningsStart && needOpenersAtStart && innings.activeModal == null) {
      dispatch(setActiveModal('OPENERS'));
    }
  }, [
    dispatch,
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
    if (!currentMatch && lastCompletedMatch) {
      if (lastCompletedMatch.tournamentId && lastCompletedMatch.fixtureId) {
        const winnerName = lastCompletedMatch.winnerTeamName ?? '';
        const resultSummary =
          lastCompletedMatch.resultReason === 'TIE'
            ? 'Match tied'
            : lastCompletedMatch.resultReason === 'NO_RESULT'
            ? 'No result'
            : winnerName
            ? `${winnerName} won`
            : 'Result saved';
        dispatch(
          completeFixture({
            tournamentId: lastCompletedMatch.tournamentId,
            fixtureId: lastCompletedMatch.fixtureId,
            status:
              lastCompletedMatch.resultReason === 'NO_RESULT'
                ? 'no_result'
                : 'completed',
            resultSummary,
          }),
        );
      }
      navigation.navigate(routes.matchsummary, { match: lastCompletedMatch });
    }
  }, [currentMatch, lastCompletedMatch, navigation]);

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]} />
    );
  }

  const safeInnings = innings!;
  const safeBattingTeamObj = battingTeamObj!;
  const safeBowlingTeamObj = bowlingTeamObj!;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScoringHeader
        innings={safeInnings}
        overs={currentMatch.overs}
        innings1={currentMatch?.innings1}
        currentInnings={currentMatch.currentInnings ?? 1}
        isPaused={isPaused}
        onTogglePause={() => dispatch(setScoringPaused(!isPaused))}
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
          <Batsmenrow innings={safeInnings} currentMatch={currentMatch} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <BatsmenBowlerScorringHeader title="Bowler" variant="bowling" />
          <Bowlerow innings={safeInnings} currentMatch={currentMatch} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <CurrentOver
            balls={safeInnings.balls || []}
            totalBalls={safeInnings.totalBalls || 0}
          />
        </View>
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
          ballEntryDisabled={isPaused || needOpeners}
          undoDisabled={ballCount === 0}
          onRunPress={runs => dispatch(recordBall({ runsOffBat: runs }))}
          onExtraPress={type => {
            if (type === 'wide' || type === 'noball') {
              dispatch(recordBall({ extra: type, extraRuns: 1 }));
            } else {
              dispatch(recordBall({ extra: type, extraRuns: 1 }));
            }
          }}
          onWicketPress={() => dispatch(recordBall({ wicket: true }))}
          onUndoPress={() => dispatch(undoLastBall())}
          onEndOverPress={() => {}}
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
        onClose={() => {
          if (needOpeners) return;
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
