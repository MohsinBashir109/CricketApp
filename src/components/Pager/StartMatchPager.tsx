import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import OverSelection from '../Flatlistcomponents/OverSelection';
import PagerView from 'react-native-pager-view';
import StartmatchHeader from '../Headers/StartmatchHeader';
import { useNavigation } from '@react-navigation/native';
import SelectTeams from '../Flatlistcomponents/SelectTeams';
import { MatchSetup } from '../../types/Playertype';
import AddPlayers from '../Flatlistcomponents/AddPlayers';

const DATA = [
  { id: '1', title: '10 overs', overs: 10 },
  { id: '2', title: '20 overs', overs: 20 },
  { id: '3', title: '50 overs ', overs: 50 },
  { id: '4', title: 'Custom overs', overs: 0 },
];
const StartMatchPager = () => {
  const navigation = useNavigation<any>();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const [match, setMatch] = useState<MatchSetup>({
    teamA: { id: 1, name: '', players: [] },
    teamB: { id: 2, name: '', players: [] },
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
        <View key="1" style={styles.page}>
          <OverSelection
            onSelect={overs => {
              console.log('Selected overs:', overs);
              pagerRef.current?.setPage(1);
            }}
          />
        </View>
        <View key="2" style={styles.page}>
          <SelectTeams
            onSelect={teams => {
              setMatch(prev => ({
                ...prev,
                teamA: {
                  ...prev?.teamA,
                  name: teams?.teamA,
                },
                teamB: {
                  ...prev?.teamB,
                  name: teams?.teamB,
                },
              }));
              pagerRef.current?.setPage(2);
            }}
          />
        </View>
        <View key="3" style={styles.page}>
          <AddPlayers
            teamsSelected={match}
            onSelect={players => {
              setMatch(prev => ({
                ...prev,
                teamA: { ...prev.teamA, players: players },
                teamB: { ...prev.teamB, players: players },
              }));
              pagerRef.current?.setPage(3);
            }}
          />
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
