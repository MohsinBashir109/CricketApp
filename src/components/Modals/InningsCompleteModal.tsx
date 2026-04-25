import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import Button from '../themeButton';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowLg } from '../../utils/cardShadow';

type Props = {
  visible: boolean;
  inningsLabel: string; // "Innings 1" / "Innings 2"
  battingTeamName: string;
  scoreText: string; // "120/5 (10.0 ov)"
  onClose: () => void;
  onPressContinue: () => void;
};

const InningsCompleteModal = ({
  visible,
  inningsLabel,
  battingTeamName,
  scoreText,
  onClose,
  onPressContinue,
}: Props) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const title = useMemo(() => `${inningsLabel} complete`, [inningsLabel]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            isDark ? styles.sheetShadowDark : styles.sheetShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted, borderColor: theme.primary }]}>
              <ThemeText style={styles.iconText} color="primary">
                ✓
              </ThemeText>
            </View>
            <View style={styles.headerTitles}>
              <ThemeText style={styles.title} color="text">
                {title}
              </ThemeText>
              <ThemeText style={styles.sub} color="secondaryText" numberOfLines={2}>
                {battingTeamName} finished their innings.
              </ThemeText>
            </View>
            <Pressable hitSlop={12} onPress={onClose} style={styles.closeHit}>
              <ThemeText style={styles.closeX} color="secondaryText">
                ✕
              </ThemeText>
            </Pressable>
          </View>

          <View style={[styles.scoreCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemeText style={styles.scoreTeam} color="secondaryText">
              {battingTeamName}
            </ThemeText>
            <ThemeText style={styles.scoreText} color="text">
              {scoreText}
            </ThemeText>
          </View>

          <ThemeText style={styles.hint} color="secondaryText">
            You can continue to the next innings when ready.
          </ThemeText>

          <View style={styles.actions}>
            <Button title="Start next innings" onPress={onPressContinue} />
            <Pressable onPress={onClose} style={styles.stayWrap}>
              <ThemeText style={styles.stayText} color="secondaryText">
                Close
              </ThemeText>
            </Pressable>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderRadius: widthPixel(18),
    borderWidth: 1,
    padding: widthPixel(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: widthPixel(12),
  },
  iconWrap: {
    width: widthPixel(42),
    height: widthPixel(42),
    borderRadius: widthPixel(14),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  headerTitles: {
    flex: 1,
    paddingRight: widthPixel(6),
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  sub: {
    marginTop: heightPixel(6),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  closeHit: { padding: widthPixel(4) },
  closeX: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(18),
  },
  scoreCard: {
    marginTop: heightPixel(14),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
  },
  scoreTeam: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    marginBottom: heightPixel(6),
  },
  scoreText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  hint: {
    marginTop: heightPixel(12),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  actions: {
    marginTop: heightPixel(14),
  },
  stayWrap: {
    alignSelf: 'center',
    paddingVertical: heightPixel(12),
  },
  stayText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});

export default InningsCompleteModal;

