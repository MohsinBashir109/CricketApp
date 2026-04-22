import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import Button from '../themeButton';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowLg } from '../../utils/cardShadow';

type Props = {
  visible: boolean;
  teamAName: string;
  teamBName: string;
  /** After a tied Super Over, copy explains replay vs draw. */
  superOverAlsoTied?: boolean;
  onChooseDraw: () => void;
  onChooseSuperOver: () => void;
};

const TieResolutionModal = ({
  visible,
  teamAName,
  teamBName,
  superOverAlsoTied = false,
  onChooseDraw,
  onChooseSuperOver,
}: Props) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.wrap}>
        <View style={styles.backdrop} />
        <View
          style={[
            styles.sheet,
            isDark ? styles.sheetShadowDark : styles.sheetShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
        <ThemeText color="text" style={styles.title}>
          {superOverAlsoTied ? 'Super Over tied' : 'Match tied'}
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.body}>
          {superOverAlsoTied
            ? 'Scores are still level after this Super Over. You can end the match as a tie, or play another Super Over — repeat as many rounds as you need until one team wins.'
            : `Main innings are level (${teamAName} vs ${teamBName}). Choose how to decide the match.`}
        </ThemeText>

        <Button title="Count as draw (tie)" onPress={onChooseDraw} />

        {!superOverAlsoTied ? (
          <View style={styles.spacer}>
            <Button title="Play Super Over (1 over each)" onPress={onChooseSuperOver} />
          </View>
        ) : (
          <View style={styles.spacer}>
            <Button title="Play another Super Over" onPress={onChooseSuperOver} />
          </View>
        )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetShadowLight: cardShadowLg(false),
  sheetShadowDark: cardShadowLg(true),
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: widthPixel(16),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderRadius: widthPixel(18),
    borderWidth: 1,
    padding: widthPixel(18),
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
    marginBottom: heightPixel(8),
  },
  body: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(20),
    marginBottom: heightPixel(16),
    fontFamily: fontFamilies.medium,
  },
  spacer: {
    marginTop: heightPixel(10),
  },
});

export default TieResolutionModal;
