import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import AddPlayers from '../Flatlistcomponents/AddPlayers';
import Button from '../themeButton';
import { MatchSetup } from '../../types/Playertype';
import OverSelection from '../Flatlistcomponents/OverSelection';
import PagerView from 'react-native-pager-view';
import SelectTeams from '../Flatlistcomponents/SelectTeams';
import StartmatchHeader from '../Headers/StartmatchHeader';
import Toss from '../Flatlistcomponents/Toss';
import { routes } from '../../utils/routes';
import { setmatch } from '../../features/match/matchSlice';
import { useNavigation } from '@react-navigation/native';

const DATA = [
  { id: '1', title: '10 overs' },
  { id: '2', title: '20 overs' },
  { id: '3', title: '50 overs ' },
  { id: '4', title: 'Custom overs' },
];
const StartMatchPager = () => {
  const navigation = useNavigation<any>();

  const dispatch = useDispatch();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const [match, setMatch] = useState<MatchSetup>({
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

  console.log('Current page:', page);
  console.log('Selected teams:', match);
  const pageTittle = (page: number) => {
    switch (page) {
      case 0:
        return 'Select the number of overs';
      case 1:
        return 'Create Teams';
      case 2:
        return 'Add Players';
      default:
        return 'Select the number of overs';
    }
  };

  const onBack = () => {
    if (page > 0) {
      pagerRef.current?.setPage(page - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StartmatchHeader
        title={pageTittle(page)}
        onBack={onBack}
        steps={DATA}
        currentStep={page}
      />
      <PagerView
        style={[styles.pagerView]}
        initialPage={0}
        ref={pagerRef}
        scrollEnabled={false}
        onPageSelected={e => setPage(e.nativeEvent.position)}
      >
        <View key="0" style={styles.page}>
          <OverSelection
            onSelect={overs => {
              console.log('Selected overs:', overs);
              setMatch(prev => ({ ...prev, overs }));
              pagerRef.current?.setPage(1);
            }}
          />
        </View>
        <View key="1" style={styles.page}>
          <SelectTeams
            onSelect={teams => {
              setMatch(prev => ({
                ...prev,
                teamA: {
                  ...prev?.teamA!,
                  name: teams?.teamA,
                },
                teamB: {
                  ...prev?.teamB!,
                  name: teams?.teamB,
                },
              }));
              pagerRef.current?.setPage(2);
            }}
          />
        </View>
        <View key="2" style={styles.page}>
          <AddPlayers
            teamsSelected={match}
            onSelect={(teamAPlayers, teamBPlayers) => {
              setMatch(prev => ({
                ...prev,
                teamA: { ...prev?.teamA!, players: teamAPlayers },
                teamB: { ...prev?.teamB!, players: teamBPlayers },
              }));

              if (teamAPlayers.length > 0 && teamBPlayers.length > 0) {
                pagerRef.current?.setPage(3);
              }
            }}
          />
        </View>
        <View key="3" style={styles.page}>
          <Toss
            match={match}
            onSelect={(tossWinner, electedTo) => {
              const tossWinnerName =
                tossWinner === 'teamA'
                  ? match?.teamA?.name ?? ''
                  : match?.teamB?.name ?? '';
              const battingTeam =
                electedTo === 'bat'
                  ? tossWinner
                  : tossWinner === 'teamA'
                  ? 'teamB'
                  : 'teamA';
              const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';
              const battingTeamName =
                battingTeam === 'teamA'
                  ? match.teamA?.name ?? ''
                  : match.teamB?.name ?? '';
              const bowlingTeamName =
                bowlingTeam === 'teamA'
                  ? match.teamA?.name ?? ''
                  : match.teamB?.name ?? '';
              const initInnings = (
                battingTeam: 'teamA' | 'teamB',
                bowlingTeam: 'teamA' | 'teamB',
              ) => ({
                battingTeam,
                bowlingTeam,
                bowlingTeamName,
                battingTeamName,
                totalRuns: 0,
                totalWickets: 0,
                totalBalls: 0,
                strikerId: null,
                nonStrikerId: null,
                bowlerId: null,
                balls: [],
              });
              setMatch(prev => ({
                ...prev,
                tossWinner,
                electedTo,
                currentInnings: 1,
                tossWinnerName,
                innings1: initInnings(battingTeam, bowlingTeam),
                innings2: initInnings(bowlingTeam, battingTeam),
              }));
              pagerRef.current?.setPage(4);
            }}
          />
        </View>
        <View key="4" style={styles.page}>
          <View style={{ flex: 1, width: '100%' }}>
            <Button
              title="Start Match"
              onPress={() => {
                dispatch(setmatch(match));
                navigation.replace(routes.home);
              }}
            />
          </View>
        </View>
      </PagerView>
    </View>
  );
};

export default StartMatchPager;

const styles = StyleSheet.create({
  pagerView: {
    flex: 1,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  pageText: {
    fontSize: 20,
  },
});
