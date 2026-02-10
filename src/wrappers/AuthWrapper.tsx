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

type props = {
  text?: string;
  children: React.ReactNode;
  desText?: string;
};

const AuthWrapper = ({ children, text, desText }: props) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  return (
    <ImageBackground
      source={undefined}
      style={[
        styles.background,
        {
          paddingTop: insets.top,
          backgroundColor: colors[isDark ? 'dark' : 'light'].background,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: heightPixel(40),
        }}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={undefined} resizeMode="contain" style={styles.image} />
        </View>
        <View
          style={{
            flex: 1,
          }}
        >
          {text && (
            <ThemeText color="text" style={styles.textChildern}>
              {text}
            </ThemeText>
          )}
          {desText && (
            <ThemeText color="desText" style={styles.desText}>
              {desText}
            </ThemeText>
          )}
        </View>
      </View>
      <Image
        resizeMode="contain"
        source={undefined}
        style={styles.imageDroplets}
      />
      <Image
        resizeMode="contain"
        source={undefined}
        style={styles.imageDroplets2}
      />
      {children}
    </ImageBackground>
  );
};

export default AuthWrapper;

const styles = StyleSheet.create({
  image: {
    width: widthPixel(80),
    height: heightPixel(110),
    marginBottom: heightPixel(40),
  },
  background: {
    flex: 1,
    paddingHorizontal: widthPixel(25),
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
