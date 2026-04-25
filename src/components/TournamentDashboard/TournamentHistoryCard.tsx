import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { useThemeContext } from '../../theme/themeContext';

type TournamentHistoryCardProps = {
  title: string;
  subtitle: string;
  iconGlyph: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  onPress: () => void;
};

const TournamentHistoryCard = ({
  title,
  subtitle,
  iconGlyph,
  iconBg,
  iconColor,
  borderColor,
  onPress,
}: TournamentHistoryCardProps) => {
  const { isDark } = useThemeContext();
  const bg = isDark ? 'rgba(20, 26, 24, 0.72)' : 'rgba(255,255,255,0.92)';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor,
          borderWidth: 1,
          backgroundColor: bg,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.innerRow}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <ThemeText color="text" style={[styles.iconGlyph, { color: iconColor }]}>
              {iconGlyph}
            </ThemeText>
          </View>
          <View style={styles.textCol}>
            <ThemeText color="text" style={styles.title}>
              {title}
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.sub}>
              {subtitle}
            </ThemeText>
          </View>
          <ThemeText color="text" style={styles.chevron}>
            ›
          </ThemeText>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: widthPixel(18),
    overflow: 'hidden',
  },
  inner: {
    width: '100%',
    borderRadius: widthPixel(18),
    overflow: 'hidden',
    minHeight: heightPixel(68),
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    position: 'relative',
    zIndex: 1,
  },
  iconWrap: {
    width: widthPixel(36),
    height: widthPixel(36),
    borderRadius: widthPixel(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.bold,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  sub: {
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
    lineHeight: fontPixel(14),
  },
  chevron: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(18),
    marginTop: -heightPixel(2),
  },
});

export default TournamentHistoryCard;
