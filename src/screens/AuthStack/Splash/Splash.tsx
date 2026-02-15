import { CommonActions, useNavigation } from '@react-navigation/native';
import { Image, Platform, StatusBar, StyleSheet, View } from 'react-native';
import React, { useEffect } from 'react';
import { heightPixel, widthPixel } from '../../../utils/constants';

import ThemeText from '../../../components/ThemeText';
import { auth } from '../../../dbConfig/firebase';
import { logo } from '../../../assets/images';
import { onAuthStateChanged } from 'firebase/auth';
import { routes } from '../../../utils/routes';
import { setuser } from '../../../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import { useThemeContext } from '../../../theme/themeContext';

const Splash = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();
  const dispatch = useDispatch();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      console.log('Auth state changed, user:', user);
      dispatch(setuser(user));
      const timer = setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: user ? routes.home : routes.signIn }],
          }),
        );
      }, 3000);

      return () => clearTimeout(timer);
    });

    return unsub;
  }, [navigation]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 34,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.imageContainer}>
        <Image source={logo} resizeMode="contain" style={styles.image} />
        <ThemeText color="secondary" style={styles.loadingText}>
          Loading the match…
        </ThemeText>
      </View>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  imageContainer: {
    paddingTop: heightPixel(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: widthPixel(400),
    height: heightPixel(400),
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: heightPixel(10),
  },
});
