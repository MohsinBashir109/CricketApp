import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { widthPixel, heightPixel, fontPixel } from '../../utils/constants';
import { fontFamilies } from '../../utils/fontfamilies';
import { colors } from '../../utils/colors';
import { useThemeContext } from '../../theme/themeContext';

type BallItem = {
  over: number;
  ballInOver: number;
  runs: number;
  extra?: 'wide' | 'noball' | 'bye' | 'legbye' | null;
  wicket?: boolean;
};

type Props = {
  balls: BallItem[];
  totalBalls: number;
};

const formatBall = (b: BallItem) => {
  if (b.wicket) return 'W';
  if (b.extra === 'wide') return `Wd${b.runs > 1 ? b.runs : ''}`;
  if (b.extra === 'noball') return `Nb${b.runs > 1 ? b.runs : ''}`;
  if (b.extra === 'bye') return `B${b.runs || 1}`;
  if (b.extra === 'legbye') return `Lb${b.runs || 1}`;
  return b.runs === 0 ? '•' : String(b.runs);
};

const CurrentOver: React.FC<Props> = ({ balls, totalBalls }) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const currentOverNumber = Math.floor((totalBalls ?? 0) / 6) + 1;

  const currentOverBalls = useMemo(() => {
    return (balls ?? []).filter(b => b.over === currentOverNumber);
  }, [balls, currentOverNumber]);

  const overRuns = useMemo(() => {
    return currentOverBalls.reduce((sum, b) => sum + (b.runs ?? 0), 0);
  }, [currentOverBalls]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <ThemeText color="text" style={styles.title}>
          This over
        </ThemeText>
        <View style={[styles.runsPill, { backgroundColor: theme.primaryMuted }]}>
          <ThemeText color="primary" style={styles.subtitle}>
            {overRuns} runs
          </ThemeText>
        </View>
      </View>

      <View style={styles.ballsRow}>
        {currentOverBalls.length === 0 ? (
          <ThemeText color="secondaryText" style={styles.empty}>
            No balls bowled yet in this over
          </ThemeText>
        ) : (
          currentOverBalls.map((b, idx) => (
            <View
              key={`${b.over}-${idx}`}
              style={[
                styles.ballPill,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceElevated,
                },
              ]}
            >
              <ThemeText color="text" style={styles.ballText}>
                {formatBall(b)}
              </ThemeText>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default CurrentOver;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(14),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightPixel(10),
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
  },
  runsPill: {
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(20),
  },
  subtitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  ballsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(8),
  },
  ballPill: {
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(8),
    borderRadius: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
  },
  ballText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  empty: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
  },
});
