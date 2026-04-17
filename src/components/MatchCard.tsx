import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';
import { useThemeContext } from '../theme/themeContext';
import ThemeText from './ThemeText';

type MatchCardProps = {
  teamAName?: string;
  teamBName?: string;
  onPress?: () => void;
  children?: React.ReactNode;
};

const MatchCard = ({ teamAName, teamBName, onPress, children }: MatchCardProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: widthPixel(8),
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
});

