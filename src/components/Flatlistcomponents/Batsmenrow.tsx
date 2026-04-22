import { StyleSheet, View } from 'react-native';
import React, { useMemo } from 'react';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { aggregateBattingFromBalls } from '../../utils/inningsStatsFromBalls';

import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

interface BatsmenRowProps {
  innings?: any;
  currentMatch?: any;
  /** When set, drives ball-only stats row (Super Over); when unset, uses currentInnings 3/4. */
  useInningsBallsOnlyStats?: boolean;
}

const calcStrikeRate = (runs?: number, balls?: number) => {
  if (!balls || balls <= 0) return '--';
  return (((runs ?? 0) / balls) * 100).toFixed(2);
};

const getOutText = (
  player: any,
  currentMatch: any,
  innings: any,
  battingKey: 'teamA' | 'teamB' | undefined,
) => {
  if (!player?.isOut) return 'not out';

  const bowlingKey = innings?.bowlingTeam as 'teamA' | 'teamB' | undefined;

  const bowlingPlayers = bowlingKey ? currentMatch?.[bowlingKey]?.players : [];
  const battingPlayers = battingKey ? currentMatch?.[battingKey]?.players : [];

  const bowler =
    bowlingPlayers?.find((p: any) => p.id === player?.outByBowlerId) ?? null;
  const fielder =
    battingPlayers?.find((p: any) => p.id === player?.outByFielderId) ?? null;

  const type = (player?.outType ?? '').trim().toLowerCase();

  if (type === 'caught' || type === 'c') {
    return `c ${fielder?.name ?? 'fielder'} b ${bowler?.name ?? 'bowler'}`;
  }
  if (type === 'bowled' || type === 'b') {
    return `b ${bowler?.name ?? 'bowler'}`;
  }
  if (type === 'lbw') {
    return `lbw b ${bowler?.name ?? 'bowler'}`;
  }
  if (type === 'run out' || type === 'runout') {
    return `run out (${fielder?.name ?? 'fielder'})`;
  }
  if (type === 'stumped' || type === 'st') {
    return `st ${fielder?.name ?? 'keeper'} b ${bowler?.name ?? 'bowler'}`;
  }
  return (player?.outType ?? 'out').toString();
};

const getSuperOverOutText = (
  playerId: number,
  innings: any,
  currentMatch: any,
  bowlingKey: 'teamA' | 'teamB' | undefined,
) => {
  const balls = innings?.balls ?? [];
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    if (b?.wicket && b?.dismissedBatsmanId === playerId) {
      const bowlingPlayers = bowlingKey
        ? currentMatch?.[bowlingKey]?.players ?? []
        : [];
      const bowler = bowlingPlayers.find((p: any) => p.id === b.bowlerId);
      return `b ${bowler?.name ?? 'bowler'}`;
    }
  }
  return 'not out';
};

const Batsmenrow = ({
  innings,
  currentMatch,
  useInningsBallsOnlyStats,
}: BatsmenRowProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const battingKey = innings?.battingTeam as 'teamA' | 'teamB' | undefined;
  const bowlingKey = innings?.bowlingTeam as 'teamA' | 'teamB' | undefined;

  const ci = currentMatch?.currentInnings ?? 1;
  const isSuperOverInnings =
    useInningsBallsOnlyStats !== undefined
      ? useInningsBallsOnlyStats
      : ci === 3 || ci === 4;

  const strikerId: number | null | undefined = innings?.strikerId;
  const nonStrikerId: number | null | undefined = innings?.nonStrikerId;

  const battingPlayers = useMemo(() => {
    return battingKey ? currentMatch?.[battingKey]?.players ?? [] : [];
  }, [battingKey, currentMatch]);

  const soBatAgg = useMemo(
    () =>
      isSuperOverInnings
        ? aggregateBattingFromBalls(innings?.balls)
        : null,
    [isSuperOverInnings, innings?.balls],
  );

  const batsmenData = useMemo(() => {
    if (isSuperOverInnings && soBatAgg) {
      const balls = innings?.balls ?? [];
      const dismissed = new Set<number>();
      for (const b of balls) {
        if (b?.wicket && b?.dismissedBatsmanId != null) {
          dismissed.add(b.dismissedBatsmanId);
        }
      }
      const list = battingPlayers.filter((p: any) => {
        const isCurrent = p.id === strikerId || p.id === nonStrikerId;
        const hasThisInnings =
          soBatAgg.has(p.id) || dismissed.has(p.id);
        return isCurrent || hasThisInnings;
      });
      return list.sort((a: any, b: any) => {
        const rank = (id: number) =>
          id === strikerId ? 0 : id === nonStrikerId ? 1 : 2;
        return rank(a.id) - rank(b.id);
      });
    }

    const list = battingPlayers
      .filter((p: any) => {
        const isCurrent = p.id === strikerId || p.id === nonStrikerId;
        const hasBatted = (p.balls ?? 0) > 0 || (p.runs ?? 0) > 0;
        const isOut = !!p.isOut;
        return isCurrent || hasBatted || isOut;
      })
      .sort((a: any, b: any) => {
        const rank = (id: number) =>
          id === strikerId ? 0 : id === nonStrikerId ? 1 : 2;
        return rank(a.id) - rank(b.id);
      });

    return list;
  }, [
    battingPlayers,
    strikerId,
    nonStrikerId,
    isSuperOverInnings,
    soBatAgg,
    innings?.balls,
  ]);

  if (batsmenData.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemeText color="secondaryText">No batsmen yet</ThemeText>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {batsmenData.map((item: any) => {
        const isStriker = item.id === strikerId;
        const aggRow = soBatAgg?.get(item.id);
        const dispRuns = isSuperOverInnings
          ? (aggRow?.runs ?? 0)
          : (item?.runs ?? 0);
        const dispBalls = isSuperOverInnings
          ? (aggRow?.balls ?? 0)
          : (item?.balls ?? 0);
        const outLine = isSuperOverInnings
          ? getSuperOverOutText(item.id, innings, currentMatch, bowlingKey)
          : getOutText(item, currentMatch, innings, battingKey);
        return (
          <View
            key={String(item.id)}
            style={[
              styles.row,
              isStriker && {
                backgroundColor: theme.primaryMuted,
                borderRadius: widthPixel(12),
              },
            ]}
          >
            <View style={styles.left}>
              <ThemeText color="text" numberOfLines={1} style={styles.name}>
                {item?.name ?? '—'}
                {isStriker ? (
                  <ThemeText color="primary" style={styles.strikerMark}>
                    {' '}
                    *
                  </ThemeText>
                ) : null}
              </ThemeText>
              <ThemeText
                color="secondaryText"
                style={styles.outText}
                numberOfLines={1}
              >
                {outLine}
              </ThemeText>
            </View>
            <View style={styles.right}>
              <ThemeText style={styles.num} color="text">
                {dispRuns}
              </ThemeText>
              <ThemeText style={styles.num} color="text">
                {dispBalls}
              </ThemeText>
              <ThemeText style={styles.sr} color="desText">
                {calcStrikeRate(dispRuns, dispBalls)}
              </ThemeText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default Batsmenrow;

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: widthPixel(12),
    paddingBottom: heightPixel(10),
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(8),
    alignItems: 'center',
  },
  left: { flex: 1, paddingRight: widthPixel(8) },
  right: { flexDirection: 'row', alignItems: 'center' },
  name: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(15),
  },
  strikerMark: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
  },
  outText: {
    fontSize: fontPixel(12),
    marginTop: heightPixel(3),
    fontFamily: fontFamilies.regular,
  },
  num: {
    width: widthPixel(40),
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
  },
  sr: {
    width: widthPixel(52),
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
  empty: {
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(16),
  },
});
