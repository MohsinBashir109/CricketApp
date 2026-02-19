import { StatusBar, StyleSheet, Text, View } from 'react-native';

import BatsmenBowlerCard, {
  BatsmanRow,
  BowlerRow,
} from '../../../components/Cards/BatsmenBowlerCard';
import React, { useEffect, useState } from 'react';
import ScoreControls from '../../../components/Flatlistcomponents/ScoreControls';
import ScoringHeader from '../../../components/Headers/ScoringHeader';
import { colors } from '../../../utils/colors';
import { useDispatch, useSelector } from 'react-redux';
import { useThemeContext } from '../../../theme/themeContext';
import { Player } from '../../../types/Playertype';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { fontFamilies } from '../../../utils/fontfamilies';
import ThemeText from '../../../components/ThemeText';
import { addStrikerAndBowlerInnings } from '../../../features/match/matchSlice';
import BatsmenBowlerScorringHeader from '../../../components/Headers/BatsmenScorringHeader';
import Batsmenrow from '../../../components/Flatlistcomponents/Batsmenrow';
import Bowlerow from '../../../components/Flatlistcomponents/BowlerRow';

const MatchScoring = () => {
  const { isDark } = useThemeContext();
  const { currentMatch } = useSelector((state: any) => state.match);
  const [openersModal, setOpenersModal] = useState(true);
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
    innings?.strikerId == null ||
    innings?.nonStrikerId == null ||
    innings?.bowlerId == null;
  useEffect(() => {
    setOpenersModal(!!shouldShowInitialModal);
  }, [shouldShowInitialModal]);
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
      <BatsmenBowlerCard
        batsmen={battingTeamObj.players || []}
        bowler={bowlingTeamObj.players || []}
        visible={openersModal}
        onClose={() => setOpenersModal(false)}
        onConfirmOpeners={({ striker, nonStriker, bowlerSelected }) => {
          setStriker(striker);
          setNonStriker(nonStriker);
          setBowlerSelected(bowlerSelected);
          setOpenersModal(false);
        }}
        innings={innings}
        currentMatch={currentMatch}
      />
      {/* <ScoreControls
        onRunPress={runs => {
          // Later: dispatch(addBall({ runsOffBat: runs, extraRuns: 0 }))
          console.log('RUN', runs);
        }}
        onExtraPress={type => {
          // Later: open a modal to enter extra runs if needed
          console.log('EXTRA', type);
        }}
        onWicketPress={() => console.log('WICKET')}
        onUndoPress={() => console.log('UNDO')}
        onEndOverPress={() => console.log('END OVER')}
      /> */}
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
