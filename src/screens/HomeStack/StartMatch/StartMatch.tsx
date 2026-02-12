import { StyleSheet, Text, View } from 'react-native';

import HomeWrapper from '../../../wrappers/HomeWrapper';
import React from 'react';
import StartMatchPager from '../../../components/Pager/StartMatchPager';

const StartMatch = () => {
  return (
    <HomeWrapper headerShown={false}>
      <View style={styles.container}>
        <StartMatchPager />
      </View>
    </HomeWrapper>
  );
};

export default StartMatch;

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
});
