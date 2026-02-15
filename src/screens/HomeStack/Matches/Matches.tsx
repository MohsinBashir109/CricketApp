import {
  Image,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';

import HomeWrapper from '../../../wrappers/HomeWrapper';
import React from 'react';
import ThemeText from '../../../components/ThemeText';
import { UserHeader } from '../../../components/Headers/UserHeader';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { live } from '../../../assets/images';
import { routes } from '../../../utils/routes';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useThemeContext } from '../../../theme/themeContext';

const Matches = () => {
  const match = useSelector((state: any) => state.match);
  const navigation = useNavigation();
  const { isDark } = useThemeContext();
  const tossWinnerKey = match?.currentMatch?.tossWinner;
  const currentMatch = match?.currentMatch;
  const tossWinnerName =
    tossWinnerKey === 'teamA'
      ? currentMatch?.teamA?.name
      : tossWinnerKey === 'teamB'
      ? currentMatch?.teamB?.name
      : '';
  const openMatch = () => {
    navigation.navigate(routes.matchscoring as never);
  };
  const CurrentMatchCard = () => {
    return (
      <TouchableOpacity
        onPress={openMatch}
        style={[
          styles.currentmatchCaed,
          {
            backgroundColor: colors[isDark ? 'dark' : 'light'].background,
            borderWidth: 1,
            borderColor: colors[isDark ? 'dark' : 'light'].gray4,
          },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          <ThemeText style={styles.text2} color="text">
            {match?.currentMatch?.teamA?.name}
          </ThemeText>

          <ThemeText color="text" style={styles.versus}>
            V
          </ThemeText>
          <ThemeText style={styles.text2} color="text">
            {match?.currentMatch?.teamB?.name}
          </ThemeText>
        </View>
        {/* <View> */}
        <ThemeText style={styles.text4} color="text">
          Match : T{match?.currentMatch?.overs}
        </ThemeText>
        <ThemeText color="text" style={styles.textdes}>
          {tossWinnerName} won the toss and elected to{' '}
          {match?.currentMatch?.electedTo}
        </ThemeText>
        {/* </View> */}
      </TouchableOpacity>
    );
  };
  return (
    <HomeWrapper headerShown={true}>
      <View style={styles.conatainer}>
        <View style={styles.innerView}>
          <View style={styles.header}>
            <Image
              source={live}
              style={styles.image}
              tintColor={colors[isDark ? 'dark' : 'light'].green}
            />
            <ThemeText style={styles.text} color="green">
              Live Match
            </ThemeText>
          </View>

          <CurrentMatchCard />
        </View>
        <View style={{ marginVertical: heightPixel(10) }}>
          <ThemeText style={styles.text} color="text">
            Recent Match
          </ThemeText>
        </View>
      </View>
    </HomeWrapper>
  );
};

export default Matches;

const styles = StyleSheet.create({
  conatainer: {
    flex: 1,
    width: '100%',
  },
  innerView: {
    marginTop: heightPixel(20),
  },
  text: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  currentmatchCaed: {
    // padding: widthPixel(10),
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(10),
    marginTop: heightPixel(10),
    borderRadius: widthPixel(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: widthPixel(10),
  },
  image: {
    width: widthPixel(20),
    height: heightPixel(20),
  },
  text2: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(15),
  },
  versus: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
    marginHorizontal: widthPixel(10),
    // backgroundColor: 'pink',
  },
  textdes: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
  },
  text4: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
    marginVertical: heightPixel(3),
  },
});
