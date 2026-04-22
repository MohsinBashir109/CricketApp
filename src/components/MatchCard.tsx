import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';
import { useThemeContext } from '../theme/themeContext';
import ThemeText from './ThemeText';
import { cardShadowSm } from '../utils/cardShadow';

type MatchCardProps = {
  teamAName?: string;
  teamBName?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  matchTypeLabel?: string | null;
};

const MatchCard = ({ teamAName, teamBName, onPress, children, matchTypeLabel }: MatchCardProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardShadowDark : styles.cardShadowLight,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed && onPress ? 0.94 : 1,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <ThemeText color="text" style={styles.team} numberOfLines={1}>
          {teamAName || '-'}
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.vs}>
          vs
        </ThemeText>
        <ThemeText color="text" style={styles.team} numberOfLines={1}>
          {teamBName || '-'}
        </ThemeText>
      </View>

      {matchTypeLabel ? (
        <View style={[styles.typePill, { backgroundColor: theme.primaryMuted }]}>
          <ThemeText color="primary" style={styles.typePillText} numberOfLines={1}>
            {matchTypeLabel}
          </ThemeText>
        </View>
      ) : null}

      {children ? <View style={styles.body}>{children}</View> : null}
    </Pressable>
  );
};

export default MatchCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: heightPixel(12),
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(14),
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: widthPixel(8),
    paddingRight: widthPixel(120),
  },
  team: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
    flexShrink: 1,
  },
  vs: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
  },
  body: {
    marginTop: heightPixel(10),
  },
  typePill: {
    position: 'absolute',
    top: heightPixel(12),
    right: widthPixel(12),
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(999),
  },
  typePillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
});

