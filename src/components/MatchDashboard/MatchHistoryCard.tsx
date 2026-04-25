import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

type MatchHistoryCardProps = {
  title: string;
  subtitle: string;
  iconGlyph: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  backgroundColor: string;
  onPress: () => void;
};

const MatchHistoryCard = ({
  title,
  subtitle,
  iconGlyph,
  iconBg,
  iconColor,
  borderColor,
  backgroundColor,
  onPress,
}: MatchHistoryCardProps) => {
  return (
    <Pressable onPress={onPress} style={[styles.card, { borderColor, backgroundColor }]}>
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
      <ThemeText color="secondaryText" style={styles.chevron}>
        ›
      </ThemeText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
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

export default MatchHistoryCard;

