import { ImageBackground, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';

import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/themeContext';
import { UserHeader } from '../components/Headers/UserHeader';
import { darkmode, lightmode3 } from '../assets/images';
import { useNavigation } from '@react-navigation/native';
import ThemeText from '../components/ThemeText';

type props = {
  text?: string;
  children: React.ReactNode;
  desText?: string;
  headerShown?: boolean;
  /** Show a back button when navigation can go back (default: true). */
  backButtonShown?: boolean;
};

const HomeWrapper = ({ children, headerShown, backButtonShown = true }: props) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const palette = colors[isDark ? 'dark' : 'light'];
  const navigation = useNavigation<any>();
  const canGoBack = backButtonShown && navigation?.canGoBack?.();
  return (
    <ImageBackground
      source={isDark ? darkmode : lightmode3}
      imageStyle={isDark ? styles.bgImageDark : styles.bgImageLight}
      style={[
        styles.background,
        {
          paddingTop: insets.top,
          backgroundColor: palette.background,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.glassOverlay, isDark ? styles.glassOverlayDark : styles.glassOverlayLight]}
      />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      {canGoBack ? (
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={[
            styles.backBtn,
            {
              backgroundColor: palette.primaryMuted,
              borderColor: palette.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ThemeText color="primary" style={styles.backArrow}>
            ‹
          </ThemeText>
        </Pressable>
      ) : null}
      {headerShown && <UserHeader />}

      {children}
    </ImageBackground>
  );
};

export default HomeWrapper;

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    top: heightPixel(10),
    left: widthPixel(16),
    width: widthPixel(40),
    height: widthPixel(40),
    borderRadius: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  backArrow: {
    fontSize: fontPixel(28),
    marginTop: -heightPixel(4),
    fontFamily: fontFamilies.semibold,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  glassOverlayDark: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  glassOverlayLight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bgImageDark: {
    opacity: 0.35,
  },
  bgImageLight: {
    opacity: 0.55,
  },
  image: {
    width: widthPixel(80),
    height: heightPixel(110),
    marginBottom: heightPixel(40),
  },
  background: {
    flex: 1,
    paddingHorizontal: widthPixel(16),
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  text: {
    fontSize: fontPixel(24),
    fontFamily: fontFamilies.bold,
    color: '#000000',
  },
  textChildern: {
    fontSize: fontPixel(20),
    fontFamily: fontFamilies.bold,
    color: '#000000',
  },
  children: {
    flex: 1,
    width: '100%',
    marginTop: heightPixel(50),
  },
  desText: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.regular,
    color: '#000000',
  },
  imageDroplets: {
    opacity: 0.1,
    position: 'absolute',

    top: heightPixel(80),
    // left: widthPixel(240),
    // height: heightPixel(150),
    // width: widthPixel(150),
    height: '100%',
    width: '100%',
    elevation: 5,
  },
  imageDroplets2: {
    opacity: 0.1,
    position: 'absolute',

    top: heightPixel(40),
    left: widthPixel(240),
    height: heightPixel(150),
    width: widthPixel(150),

    elevation: 5,
  },
});
