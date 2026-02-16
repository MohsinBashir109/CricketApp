import {
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { backarrow, pause } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import React from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { current } from '@reduxjs/toolkit';
import { fontFamilies } from '../../utils/fontfamilies';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useThemeContext } from '../../theme/themeContext';

const ScoringHeader = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();
  const { currentMatch } = useSelector((state: any) => state.match);
  const tossWinnerKey = currentMatch?.tossWinner;
  const tossWinnerName =
    tossWinnerKey === 'teamA'
      ? currentMatch?.teamA?.name
      : tossWinnerKey === 'teamB'
      ? currentMatch?.teamB?.name
      : '';
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View
      style={[
        {
          backgroundColor: colors[isDark ? 'dark' : 'light'].primary,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />

      <View style={styles.innercontainer}>
        <View style={styles.header}>
          <View>
            <Pressable hitSlop={20} onPress={handleBack}>
              <Image
                source={backarrow}
                style={styles.image}
                tintColor={colors[isDark ? 'dark' : 'light'].white}
              />
            </Pressable>
          </View>
          <View>
            <ThemeText color="text" style={styles.text}>
              T{currentMatch?.overs} Match
            </ThemeText>
          </View>
          <View>
            <Pressable hitSlop={20}>
              <Image
                source={pause}
                style={styles.image}
                tintColor={colors[isDark ? 'dark' : 'light'].white}
              />
            </Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <ThemeText color="text" style={styles.text}>
            {tossWinnerName}
          </ThemeText>
          <View style={{ flex: 1 }} />
          <ThemeText color="text" style={styles.text2}>
            Overs
          </ThemeText>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{}}>
            <ThemeText color="text" style={styles.text3}>
              127/3
            </ThemeText>
          </View>
          <View style={{ flex: 1 }} />

          <View style={{}}>
            <ThemeText color="text" style={styles.text4}>
              0/{currentMatch?.overs}
            </ThemeText>
            <ThemeText color="text" style={styles.text5}>
              CRR : 10.66
            </ThemeText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ScoringHeader;

const styles = StyleSheet.create({
  innercontainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 34,
    paddingHorizontal: widthPixel(20),
  },
  text: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  header: {
    paddingTop: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  image: {
    width: widthPixel(20),
    height: heightPixel(20),
  },
  text2: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(16),
  },
  text3: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(40),
  },
  text4: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(24),
  },
  text5: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
});
