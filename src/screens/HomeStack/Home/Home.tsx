import { CommonActions, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { fontPixel, heightPixel } from '../../../utils/constants';

import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import React from 'react';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { handleSignOut } from '../../../services/authServices';
import { matches } from '../../../assets/images';
import { routes } from '../../../utils/routes';
import { useSelector } from 'react-redux';
import { useThemeContext } from '../../../theme/themeContext';

export default function Home() {
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();
  const { user } = useSelector((state: any) => state.auth);
  const match = useSelector((state: any) => state.match);
  console.log('====================================');
  console.log(match);
  console.log('====================================');
  console.log('user in home screen', user);
  const handleLogout = async () => {
    const res = await handleSignOut();

    if (res?.ok) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routes.auth }], // OR routes.authStack (see note below)
        }),
      );
    }
  };
  const StartMatch = () => {
    navigation.navigate(routes.startMatch);
  };

  return (
    <HomeWrapper headerShown={true}>
      <View style={styles.container}>
        <Button
          title="Start New Match"
          onPress={StartMatch}
          buttonStyle={styles.button}
          titleStyle={styles.text}
          leftIcon={matches}
          leftIconTintColor={colors[isDark ? 'dark' : 'light'].white}
        />
        {/* <Button title="Start New Match" onPress={handleLogout}
        // 
        
         /> */}
      </View>
    </HomeWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  button: {
    elevation: 5,
    marginTop: heightPixel(50),
  },
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(18),
  },
});
