import BatsmenBowlerCard, {
  BatsmanRow,
  BowlerRow,
} from '../../../components/Cards/BatsmenBowlerCard';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import {
  addStrikerAndBowlerInnings,
  recordBall,
  setNextBatsman,
  setNextBowler,
  undoLastBall,
} from '../../../features/match/matchSlice';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { useDispatch, useSelector } from 'react-redux';

import BatsmenBowlerScorringHeader from '../../../components/Headers/BatsmenScorringHeader';
import Batsmenrow from '../../../components/Flatlistcomponents/Batsmenrow';
import Bowlerow from '../../../components/Flatlistcomponents/BowlerRow';
import { Player } from '../../../types/Playertype';
import ScoreControls from '../../../components/Flatlistcomponents/ScoreControls';
import ScoringHeader from '../../../components/Headers/ScoringHeader';
import ThemeText from '../../../components/ThemeText';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { useThemeContext } from '../../../theme/themeContext';

const MatchScoring = () => {
  const { isDark } = useThemeContext();
  const { currentMatch } = useSelector((state: any) => state.match);

  const dispatch = useDispatch();
  const [striker, setStriker] = useState<BatsmanRow | null>(null);
  const [nonStriker, setNonStriker] = useState<BatsmanRow | null>(null);
  const [bowlerSelect, setBowlerSelected] = useState<BowlerRow | null>(null);
  const onStartInnings = () => {
    if (!striker || !nonStriker || !bowlerSelect) {
      return; // or show toast: "Please select openers and bowler"
    }

    dispatch(
      addStrikerAndBowlerInnings({
        strikerId: Number(striker.id),
        nonStrikerId: Number(nonStriker.id),
        bowlerId: Number(bowlerSelect.id),
        // innings: 1,
      }),
    );
  };
  useEffect(() => {
    onStartInnings();
  }, [striker, nonStriker, bowlerSelect]);

  console.log('----------------striker', striker);
  console.log('----------------striker', nonStriker);
  console.log('----------------striker', bowlerSelect);
  const ballsToOvers = (balls: number) =>
    `${Math.floor(balls / 6)}.${balls % 6}`;

  const calcEcon = (runs: number, balls: number) => {
    if (!balls) return 0;
    return Number(((runs * 6) / balls).toFixed(2));
  };

  const innings =
    currentMatch?.currentInnings === 1
      ? currentMatch?.innings1
      : currentMatch?.innings2;

  const shouldShowInitialModal =
    innings?.strikerId == null &&
    innings?.nonStrikerId == null &&
    innings?.bowlerId == null;
  const activeModal = innings?.activeModal;
  const battingTeamObj =
    innings.battingTeam === 'teamA' ? currentMatch.teamA : currentMatch.teamB;

  const bowlingTeamObj =
    innings.bowlingTeam === 'teamA' ? currentMatch.teamA : currentMatch.teamB;

  if (!currentMatch || !innings || !currentMatch.teamA || !currentMatch.teamB) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
      ]}
    >
      <ScoringHeader
        innings={innings}
        overs={currentMatch?.overs}
        tossWinnerName={currentMatch?.tossWinnerName}
      />

      <BatsmenBowlerScorringHeader title="Batsmen Name" />
      <Batsmenrow innings={innings} currentMatch={currentMatch} />
      <BatsmenBowlerScorringHeader title="Bowler Name" />
      <Bowlerow innings={innings} currentMatch={currentMatch} />
      {/* 1) OPENERS */}
      <BatsmenBowlerCard
        mode="OPENERS"
        batsmen={battingTeamObj.players || []}
        bowler={bowlingTeamObj.players || []}
        visible={activeModal === 'OPENERS'}
        onClose={() => {}}
        onConfirmOpeners={({ striker, nonStriker, bowlerSelected }) => {
          dispatch(
            addStrikerAndBowlerInnings({
              strikerId: Number(striker.id),
              nonStrikerId: Number(nonStriker.id),
              bowlerId: Number(bowlerSelected.id),
            }),
          );
        }}
      />

      {/* 2) NEXT BATSMAN (wicket) */}
      <BatsmenBowlerCard
        mode="NEXT_BATSMAN"
        batsmen={battingTeamObj.players || []}
        bowler={bowlingTeamObj.players || []} // ignored
        visible={activeModal === 'NEXT_BATSMAN'}
        onClose={() => {}}
        onConfirmNextBatsman={batsman => {
          dispatch(setNextBatsman({ batsmanId: Number(batsman.id) }));
        }}
      />

      {/* 3) NEXT BOWLER (over end) */}
      <BatsmenBowlerCard
        mode="NEXT_BOWLER"
        batsmen={battingTeamObj.players || []} // ignored
        bowler={bowlingTeamObj.players || []}
        visible={activeModal === 'NEXT_BOWLER'}
        onClose={() => {}}
        onConfirmNextBowler={b => {
          dispatch(setNextBowler({ bowlerId: Number(b.id) }));
        }}
      />

      <ScoreControls
        onRunPress={runs => dispatch(recordBall({ runsOffBat: runs }))}
        onExtraPress={type => {
          if (type === 'wide' || type === 'noball') {
            dispatch(recordBall({ extra: type, extraRuns: 1 }));
            return;
          }
          // bye/legbye usually needs user input (1..n)
          // for now: default 1
          dispatch(recordBall({ extra: type, extraRuns: 1 }));
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
    // backgroundColor: 'pink',
  },
  cell: {
    width: widthPixel(26),
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
});
