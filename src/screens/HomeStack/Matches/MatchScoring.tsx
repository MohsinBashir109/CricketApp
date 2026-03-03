import BatsmenBowlerCard from '../../../components/Cards/BatsmenBowlerCard';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  addStrikerAndBowlerInnings,
  completeMatchIfNeeded,
  recordBall,
  setActiveModal,
  setNextBatsman,
  setNextBowler,
  startSecondInnings,
  undoLastBall,
} from '../../../features/match/matchSlice';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { useDispatch, useSelector } from 'react-redux';

import BatsmenBowlerScorringHeader from '../../../components/Headers/BatsmenScorringHeader';
import Batsmenrow from '../../../components/Flatlistcomponents/Batsmenrow';
import Bowlerow from '../../../components/Flatlistcomponents/BowlerRow';

import ScoreControls from '../../../components/Flatlistcomponents/ScoreControls';
import ScoringHeader from '../../../components/Headers/ScoringHeader';

import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { useThemeContext } from '../../../theme/themeContext';
import CurrentOver from '../../../components/Cards/CurrentOver';

const MatchScoring = () => {
  const { isDark } = useThemeContext();
  const { currentMatch } = useSelector((state: any) => state.match);
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  // ✅ ALWAYS SAFE (can be undefined)
  const innings = useMemo(() => {
    if (!currentMatch) return undefined;
    return currentMatch.currentInnings === 1
      ? currentMatch.innings1
      : currentMatch.innings2;
  }, [currentMatch]);

  // ✅ Derived safe values (never crash)
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

  const isReady =
    !!currentMatch && !!innings && !!currentMatch.teamA && !!currentMatch.teamB;

  // ---------------- EFFECTS (must always run) ----------------

  // OPENERS modal auto-open (only when innings running)
  useEffect(() => {
    // when reducer pushes match to history and clears currentMatch
    if (!currentMatch) {
      navigation.goBack();
      // OR: navigation.replace(routes.matchHistory)
      // OR: navigation.navigate(routes.matchHistory)
    }
  }, [currentMatch, navigation]);
  useEffect(() => {
    if (!innings) return;
    if (innings.isCompleted) return;

    if (needOpeners && innings.activeModal == null) {
      dispatch(setActiveModal('OPENERS'));
    }
  }, [
    dispatch,
    innings?.isCompleted,
    innings?.activeModal,
    innings?.strikerId,
    innings?.nonStrikerId,
    innings?.bowlerId,
    needOpeners,
  ]);

  // Start second innings when first innings completes
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

  // Complete match when both innings complete
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

  if (!isReady) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
        ]}
      />
    );
  }

  // safe now because isReady true
  const safeInnings = innings!;
  const safeBattingTeamObj = battingTeamObj!;
  const safeBowlingTeamObj = bowlingTeamObj!;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
      ]}
    >
      <ScoringHeader
        innings={safeInnings}
        overs={currentMatch.overs}
        tossWinnerName={currentMatch.tossWinnerName}
      />

      <BatsmenBowlerScorringHeader title="Batsmen Name" />
      <Batsmenrow innings={safeInnings} currentMatch={currentMatch} />

      <BatsmenBowlerScorringHeader title="Bowler Name" />
      <Bowlerow innings={safeInnings} currentMatch={currentMatch} />

      {/* OPENERS */}
      <BatsmenBowlerCard
        mode="OPENERS"
        batsmen={safeBattingTeamObj.players || []}
        bowler={safeBowlingTeamObj.players || []}
        visible={activeModal === 'OPENERS'}
        onClose={() => {
          // if still missing required picks, don't close
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

      {/* NEXT BATSMAN */}
      <BatsmenBowlerCard
        mode="NEXT_BATSMAN"
        batsmen={safeBattingTeamObj.players || []}
        bowler={safeBowlingTeamObj.players || []}
        visible={activeModal === 'NEXT_BATSMAN'}
        onClose={() => dispatch(setActiveModal(null))}
        onConfirmNextBatsman={b => {
          dispatch(setNextBatsman({ batsmanId: Number(b.id) }));
        }}
      />

      {/* NEXT BOWLER */}
      <BatsmenBowlerCard
        mode="NEXT_BOWLER"
        batsmen={safeBattingTeamObj.players || []}
        bowler={safeBowlingTeamObj.players || []}
        visible={activeModal === 'NEXT_BOWLER'}
        onClose={() => dispatch(setActiveModal(null))}
        onConfirmNextBowler={b => {
          dispatch(setNextBowler({ bowlerId: Number(b.id) }));
        }}
      />

      <CurrentOver
        balls={safeInnings.balls || []}
        totalBalls={safeInnings.totalBalls || 0}
      />

      <ScoreControls
        onRunPress={runs => dispatch(recordBall({ runsOffBat: runs }))}
        onExtraPress={type => {
          // wide/noball not legal deliveries
          if (type === 'wide' || type === 'noball') {
            dispatch(recordBall({ extra: type, extraRuns: 1 }));
          } else {
            dispatch(recordBall({ extra: type, extraRuns: 1 }));
          }
        }}
        onWicketPress={() => dispatch(recordBall({ wicket: true }))}
        onUndoPress={() => dispatch(undoLastBall())}
        onEndOverPress={() => console.log('END OVER')}
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: heightPixel(10),
  },
  rowRight: {
    flexDirection: 'row',
    gap: widthPixel(14),
    alignItems: 'center',
    width: '100%',
  },
  cell: {
    width: widthPixel(26),
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
});
