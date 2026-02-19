import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { widthPixel, heightPixel, fontPixel } from '../../utils/constants';
import { fontFamilies } from '../../utils/fontfamilies';

type BallItem = {
  over: number; // 1,2,3...
  ballInOver: number; // 1-6, 0 for wide/noBall
  runs: number;
  extra?: 'wide' | 'noball' | 'bye' | 'legbye' | null;
  wicket?: boolean;
};

type Props = {
  balls: BallItem[];
  totalBalls: number; // innings.totalBalls (legal balls)
};

const formatBall = (b: BallItem) => {
  if (b.wicket) return 'W';

  if (b.extra === 'wide') return `Wd${b.runs > 1 ? b.runs : ''}`;
  if (b.extra === 'noball') return `Nb${b.runs > 1 ? b.runs : ''}`;
  if (b.extra === 'bye') return `B${b.runs || 1}`;
  if (b.extra === 'legbye') return `Lb${b.runs || 1}`;

  return b.runs === 0 ? '•' : String(b.runs); // dot ball as •
};

const CurrentOver: React.FC<Props> = ({ balls, totalBalls }) => {
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
          Over {currentOverNumber}
        </ThemeText>
        <ThemeText color="text" style={styles.subtitle}>
          Runs: {overRuns}
        </ThemeText>
      </View>

      <View style={styles.ballsRow}>
        {currentOverBalls.length === 0 ? (
          <ThemeText color="text" style={styles.empty}>
            No balls yet
          </ThemeText>
        ) : (
          currentOverBalls.map((b, idx) => (
            <View key={`${b.over}-${idx}`} style={styles.ballPill}>
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
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(10),
    paddingBottom: heightPixel(8),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightPixel(8),
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    opacity: 0.8,
  },
  ballsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(8),
  },
  ballPill: {
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(12),
    borderWidth: 1,
    borderColor: '#999',
  },
  ballText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(12),
  },
  empty: {
    opacity: 0.7,
  },
});
