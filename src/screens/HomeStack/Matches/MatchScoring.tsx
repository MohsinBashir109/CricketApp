import { StatusBar, StyleSheet, Text, View } from 'react-native';

import BatsmenBowlerCard from '../../../components/Cards/BatsmenBowlerCard';
import React from 'react';
import ScoreControls from '../../../components/Flatlistcomponents/ScoreControls';
import ScoringHeader from '../../../components/Headers/ScoringHeader';
import { colors } from '../../../utils/colors';
import { useSelector } from 'react-redux';
import { useThemeContext } from '../../../theme/themeContext';

const MatchScoring = () => {
  const { isDark } = useThemeContext();
  const { currentMatch } = useSelector((state: any) => state.match);
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
      <ScoringHeader />
      <BatsmenBowlerCard
        batsmen={battingTeamObj.players || []}
        bowler={bowlingTeamObj.players || []}
      />
      <ScoreControls
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
});
