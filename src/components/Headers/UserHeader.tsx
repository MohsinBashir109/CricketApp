import { StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import ThemeText from '../ThemeText';
import { fontFamilies } from '../../utils/fontfamilies';
import { useSelector } from 'react-redux';
import { useThemeContext } from '../../theme/themeContext';

const formatDate = () => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  } catch {
    return '';
  }
};

export const UserHeader = () => {
  const { user } = useSelector((state: any) => state.auth);
  const { isDark } = useThemeContext();

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <ThemeText style={styles.kicker} color="secondaryText">
          Dashboard
        </ThemeText>
        <ThemeText style={styles.headerText2} color="text">
          {user?.displayName || 'Scorer'}
        </ThemeText>
        <ThemeText style={styles.dateLine} color="desText">
          {formatDate()}
        </ThemeText>
      </View>
      <View style={{ flex: 1 }} />
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: isDark ? '#1A2220' : '#E6F4EF',
            borderColor: isDark ? '#2A3430' : '#D5DCD8',
          },
        ]}
      >
        <ThemeText style={styles.avatarLetter} color="primary">
          {(user?.displayName || 'C').trim().charAt(0).toUpperCase()}
        </ThemeText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: heightPixel(8),
    paddingBottom: heightPixel(16),
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  textBlock: {
    flexShrink: 1,
  },
  kicker: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerText2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(24),
    marginTop: heightPixel(2),
  },
  dateLine: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    marginTop: heightPixel(4),
  },
  avatar: {
    width: widthPixel(48),
    height: widthPixel(48),
    borderRadius: widthPixel(14),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(20),
  },
});
