import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import Button from '../themeButton';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowLg } from '../../utils/cardShadow';
import type { MatchResult } from '../../utils/matchResult';

type Props = {
  visible: boolean;
  result: MatchResult | null;
  onClose: () => void;
  onPressViewScorecard: () => void;
  onPressFinish: () => void;
};

const MatchCompleteModal = ({
  visible,
  result,
  onClose,
  onPressViewScorecard,
  onPressFinish,
}: Props) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const tone = useMemo(() => {
    if (!result) return 'neutral' as const;
    if (result.type === 'WIN_BY_RUNS' || result.type === 'WIN_BY_WICKETS' || result.type === 'MANUAL')
      return 'winner' as const;
    return 'neutral' as const;
  }, [result]);

  const icon = useMemo(() => {
    if (!result) return '✓';
    if (tone === 'winner') return '🏆';
    if (result.type === 'NO_RESULT' || result.type === 'ABANDONED') return '⏹';
    return '＝';
  }, [result, tone]);

  const accent = tone === 'winner' ? theme.primary : theme.border;
  const accentBg = tone === 'winner' ? theme.primaryMuted : theme.surface;

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
            <View style={[styles.iconWrap, { backgroundColor: accentBg, borderColor: accent }]}>
              <ThemeText style={styles.iconText} color={tone === 'winner' ? 'primary' : 'secondaryText'}>
                {icon}
              </ThemeText>
            </View>
            <View style={styles.headerTitles}>
              <ThemeText style={styles.title} color="text">
                {result?.title ?? 'Match Complete'}
              </ThemeText>
              {result?.resultText ? (
                <ThemeText style={styles.resultText} color="text">
                  {result.resultText}
                </ThemeText>
              ) : null}
            </View>
            <Pressable hitSlop={12} onPress={onClose} style={styles.closeHit}>
              <ThemeText style={styles.closeX} color="secondaryText">
                ✕
              </ThemeText>
            </Pressable>
          </View>

          {result?.summary ? (
            <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <View style={styles.summaryRow}>
                <ThemeText style={styles.teamName} color="secondaryText">
                  {result.summary.teamAName}
                </ThemeText>
                <ThemeText style={styles.teamScore} color="text">
                  {result.summary.teamAScore}
                </ThemeText>
              </View>
              <View style={styles.summaryRow}>
                <ThemeText style={styles.teamName} color="secondaryText">
                  {result.summary.teamBName}
                </ThemeText>
                <ThemeText style={styles.teamScore} color="text">
                  {result.summary.teamBScore}
                </ThemeText>
              </View>
            </View>
          ) : null}

          {result?.message ? (
            <ThemeText style={styles.message} color="secondaryText">
              {result.message}
            </ThemeText>
          ) : null}

          <View style={styles.actions}>
            <Button title="View Scorecard" onPress={onPressViewScorecard} />
            <View style={styles.actionSpacer} />
            <Button title="Finish Match" onPress={onPressFinish} />
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
  resultText: {
    marginTop: heightPixel(6),
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
  },
  closeHit: { padding: widthPixel(4) },
  closeX: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(18),
  },
  summaryCard: {
    marginTop: heightPixel(14),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
    gap: heightPixel(6),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: widthPixel(10),
  },
  teamName: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
  },
  teamScore: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  message: {
    marginTop: heightPixel(12),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  actions: {
    marginTop: heightPixel(14),
  },
  actionSpacer: {
    height: heightPixel(10),
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

export default MatchCompleteModal;

