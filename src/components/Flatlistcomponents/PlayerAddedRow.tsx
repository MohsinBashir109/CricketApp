import { Image, StyleSheet, View } from 'react-native';
import { allrounder, bat, bowlericon, wicket } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import { Player } from '../../types/Playertype';
import React from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

interface PlayerAddedProps {
  item?: Player;
}

const PlayerAddedRow = ({ item }: PlayerAddedProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const getRoleMeta = (role: any) => {
    switch (role) {
      case 'batsman':
        return { label: 'Batsman', icon: bat };
      case 'bowler':
        return { label: 'Bowler', icon: bowlericon };
      case 'allrounder':
        return { label: 'All-rounder', icon: allrounder };
      case 'wicketkeeper':
        return { label: 'Wicketkeeper', icon: wicket };
      default:
        return { label: 'Unknown', icon: null };
    }
  };

  const { icon } = getRoleMeta(item?.role);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderColor: theme.gray4,
        },
      ]}
    >
      <View style={styles.colSr}>
        <ThemeText style={styles.text} color="text">
          {item?.id}
        </ThemeText>
      </View>

      <View style={styles.colName}>
        <ThemeText style={styles.text} color="text" numberOfLines={1}>
          {item?.name}
        </ThemeText>
      </View>

      <View style={styles.colRole}>
        {!!icon && <Image source={icon} style={styles.image} />}
      </View>
    </View>
  );
};

export default PlayerAddedRow;

const styles = StyleSheet.create({
  container: {
    paddingVertical: heightPixel(7),
    paddingHorizontal: widthPixel(10),
    flexDirection: 'row',
    alignItems: 'center', // ✅ important (vertical alignment)
    elevation: 2,
    borderWidth: 1,
  },

  // ✅ EXACT SAME column widths as header
  colSr: {
    flex: 0.2,
    alignItems: 'flex-start', // match header
  },
  colName: {
    flex: 0.65,
    paddingHorizontal: widthPixel(6),
  },
  colRole: {
    flex: 0.15,
    alignItems: 'center',
  },

  text: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
  },

  image: {
    width: widthPixel(20),
    height: heightPixel(20),
  },
});
