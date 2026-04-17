import { CommonActions, useNavigation } from '@react-navigation/native';
import { ImageBackground, Platform, StatusBar, StyleSheet } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { heightPixel, widthPixel } from '../../../utils/constants';

import { auth } from '../../../dbConfig/firebase';

import { onAuthStateChanged } from 'firebase/auth';
import { routes } from '../../../utils/routes';
import { setuser } from '../../../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import { splashImage } from '../../../assets/images';

const Splash = () => {
  const navigation = useNavigation<any>();

  const dispatch = useDispatch();
  const hasNavigatedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      source={splashImage}
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 34,
        },
      ]}
    >
      {/* <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      /> */}

      {/* <View style={styles.imageContainer}>
        <Image source={logo} resizeMode="contain" style={styles.image} />
        <ThemeText color="secondary" style={styles.loadingText}>
          Loading the match…
        </ThemeText>
      </View> */}
    </ImageBackground>
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
