import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import ThemeText from '../ThemeText';
import { throphy } from '../../assets/images';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowLg, cardShadowSm } from '../../utils/cardShadow';
import type { colors } from '../../utils/colors';

type Theme = typeof colors.light;

/** Navy CTA card — avoid theme.primary in dark mode (it is brand green there). */
const SAVED_TEAMS_CARD_BG = '#12305A';

type Props = {
  onSavedPress: () => void;
  onNewPress: () => void;
  savedDisabled: boolean;
  theme: Theme;
  isDark: boolean;
  newTeamActive: boolean;
};

const ChooseTeamsActionCards: React.FC<Props> = ({
  onSavedPress,
  onNewPress,
  savedDisabled,
  theme,
  isDark,
  newTeamActive,
}) => {
  const gold = theme.accent;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onSavedPress}
        disabled={savedDisabled}
        style={({ pressed }) => [
          styles.card,
          styles.cardSaved,
          isDark ? styles.cardSavedShadowDark : styles.cardSavedShadowLight,
          {
            backgroundColor: SAVED_TEAMS_CARD_BG,
            opacity: savedDisabled ? 0.45 : pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Image source={throphy} style={styles.iconInner} resizeMode="contain" tintColor={gold} />
        </View>
        <ThemeText color="white" style={styles.cardTitle}>
          Add from saved teams
        </ThemeText>
        <Text style={[styles.cardArrow, { color: gold }]}>›</Text>
      </Pressable>

      <Pressable
        onPress={onNewPress}
        style={({ pressed }) => [
          styles.card,
          styles.cardNew,
          isDark ? styles.cardNewShadowDark : styles.cardNewShadowLight,
          {
            backgroundColor: theme.surface,
            opacity: pressed ? 0.94 : 1,
            borderWidth: newTeamActive ? 2 : 1,
            borderColor: newTeamActive ? theme.extras : theme.border,
          },
        ]}
      >
        <View style={[styles.iconCircleNew, { backgroundColor: theme.primaryMuted }]}>
          <Text style={[styles.plusGlyph, { color: theme.extras }]}>+</Text>
        </View>
        <ThemeText color="text" style={styles.cardTitleNew}>
          {newTeamActive ? 'Close builder' : 'Add new team'}
        </ThemeText>
        <Text style={[styles.cardArrow, { color: theme.extras }]}>›</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardNewShadowLight: cardShadowSm(false),
  cardNewShadowDark: cardShadowSm(true),
  cardSavedShadowLight: cardShadowLg(false),
  cardSavedShadowDark: cardShadowLg(true),
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: widthPixel(12),
    marginBottom: heightPixel(22),
  },
  card: {
    flex: 1,
    minHeight: heightPixel(124),
    borderRadius: widthPixel(16),
    padding: widthPixel(16),
    justifyContent: 'space-between',
  },
  cardSaved: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardNew: {
    overflow: 'hidden',
  },
  iconCircle: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleNew: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: widthPixel(24),
    height: widthPixel(24),
  },
  plusGlyph: {
    fontSize: fontPixel(26),
    fontFamily: fontFamilies.bold,
    marginTop: -heightPixel(2),
  },
  cardTitle: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.bold,
    lineHeight: fontPixel(18),
    marginTop: heightPixel(8),
  },
  cardTitleNew: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.bold,
    lineHeight: fontPixel(18),
    marginTop: heightPixel(8),
  },
  cardArrow: {
    fontSize: fontPixel(22),
    fontFamily: fontFamilies.bold,
    alignSelf: 'flex-end',
    marginTop: heightPixel(4),
  },
});

export default ChooseTeamsActionCards;
