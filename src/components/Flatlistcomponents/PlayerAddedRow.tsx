import { Player } from '../../types/Playertype';
import ThemeText from '../ThemeText';
import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { allrounder, bowler } from '../../assets/images';
interface PlayarAddedprops {
  item?: Player;
}

const PlayerAddedRow = ({ item }: PlayarAddedprops) => {
  console.log('--------------->', item);
  const getRoleMeta = (role: any) => {
    switch (role) {
      case 'batsman':
        return { label: 'Batsman', icon: bowler };
      case 'bowler':
        return { label: 'Bowler', icon: bowler };
      case 'allrounder':
        return { label: 'All-rounder', icon: allrounder };
      case 'wicketkeeper':
        return { label: 'Wicketkeeper', icon: allrounder };
      default:
        return { label: 'Unknown', icon: null };
    }
  };
  const { isDark } = useThemeContext();
  const { label, icon } = getRoleMeta(item?.role);
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors[isDark ? 'dark' : 'light'].background,
          borderColor: colors[isDark ? 'dark' : 'light'].gray4,
        },
      ]}
    >
      <View style={styles.name}>
        <ThemeText style={styles.playername} color="text">
          {item?.name}
        </ThemeText>
      </View>

      <View>
        <Image source={icon} style={styles.image} />
      </View>
    </View>
  );
};

export default PlayerAddedRow;

const styles = StyleSheet.create({
  container: {
    paddingVertical: heightPixel(7),
    paddingHorizontal: widthPixel(10),
    // marginVertical: heightPixel(5),
    flexDirection: 'row',
    elevation: 2,
    borderWidth: 1,
  },
  name: { flex: 0.8 },
  playername: { fontFamily: fontFamilies.medium, fontSize: fontPixel(12) },
  image: {
    width: widthPixel(20),
    height: heightPixel(20),
  },
});
