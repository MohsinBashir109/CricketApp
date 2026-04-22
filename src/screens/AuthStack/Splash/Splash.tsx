import { CommonActions, useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import React, { useEffect, useRef } from 'react';
import { heightPixel, widthPixel } from '../../../utils/constants';

import { auth } from '../../../dbConfig/firebase';

import { onAuthStateChanged } from 'firebase/auth';
import { routes } from '../../../utils/routes';
import { setuser } from '../../../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import { lightmodesplash, splashImage } from '../../../assets/images';

import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';

const Splash = () => {
  const navigation = useNavigation<any>();
  useEffect(() => {}, []);
  const dispatch = useDispatch();
  const hasNavigatedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDark } = useThemeContext();

  useEffect(() => {
    const goNext = (user: any) => {
      if (hasNavigatedRef.current) return;

      hasNavigatedRef.current = true;

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: user ? routes.home : routes.signIn }],
        }),
      );
    };
    const unsub = onAuthStateChanged(auth, user => {
      dispatch(setuser(user));
      timerRef.current = setTimeout(() => {
        goNext(user);
      }, 1500);
    });
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      unsub();
    };
  }, [dispatch, navigation]);

  return (
    <ImageBackground
      source={isDark ? splashImage : lightmodesplash}
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 34,
        },
      ]}
    >
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors[isDark ? 'dark' : 'light'].primary}
          style={{ marginBottom: heightPixel(40) }}
        />
      </View>
    </ImageBackground>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
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
