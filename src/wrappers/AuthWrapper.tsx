import {
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';

import ThemeText from '../components/ThemeText';
import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/themeContext';
import { logo, darkmode, lightmode } from '../assets/images/index';

type props = {
  text?: string;
  children: React.ReactNode;
  desText?: string;
};

const AuthWrapper = ({ children, text, desText }: props) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const palette = colors[isDark ? 'dark' : 'light'];
  return (
    <ImageBackground
      source={isDark ? darkmode : lightmode}
      // resizeMode="contain"
      // imageStyle={{ opacity: 0.8 }}
      style={[
        styles.background,
        {
          paddingTop: insets.top,
          backgroundColor: palette.background,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Image source={logo} resizeMode="contain" style={styles.image} />
          {text && (
            <ThemeText color="text" style={styles.textChildern}>
              {text}
            </ThemeText>
          )}
          {desText && (
            <ThemeText
              color={isDark ? 'secondaryText' : 'tint'}
              style={styles.desText}
            >
              {desText}
            </ThemeText>
          )}
        </View>
        <View style={styles.formArea}>{children}</View>
      </View>
    </ImageBackground>
  );
};

export default AuthWrapper;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: heightPixel(40),
    paddingHorizontal: widthPixel(25),
  },
  formArea: {
    flex: 1,
    width: '100%',
    paddingHorizontal: widthPixel(25),
  },
  image: {
    width: widthPixel(200),
    height: heightPixel(180),
    // lift the logo off the auth background (no card/container)
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  background: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
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
