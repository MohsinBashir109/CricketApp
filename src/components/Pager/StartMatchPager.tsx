import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import OverSelection from '../Flatlistcomponents/OverSelection';
import PagerView from 'react-native-pager-view';
import StartmatchHeader from '../Headers/StartmatchHeader';
import { useNavigation } from '@react-navigation/native';

const DATA = [
  { id: '1', title: ' 2 overs', overs: 2 },
  { id: '2', title: '5 overs', overs: 5 },
  { id: '3', title: '10 overs', overs: 10 },
  { id: '4', title: '20 overs', overs: 20 },
  { id: '5', title: '30 overs', overs: 30 },
  { id: '6', title: '40 overs', overs: 40 },
  { id: '7', title: '50 overs ', overs: 50 },
  { id: '8', title: 'Custom overs', overs: 0 },
];
const StartMatchPager = () => {
  const navigation = useNavigation<any>();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  console.log('Current page:', page);
  const pageTittle = (page: number) => {
    switch (page) {
      case 0:
        return 'Select the number of overs';
      case 1:
        return 'Page 2';
      case 2:
        return 'Page 3';
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
          <Text style={styles.pageText}>Page 2</Text>
        </View>
        <View key="3" style={styles.page}>
          <Text style={styles.pageText}>Page 3</Text>
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
