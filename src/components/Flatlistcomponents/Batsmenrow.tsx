import { StyleSheet, View } from 'react-native';
import React, { useMemo } from 'react';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

interface BatsmenRowProps {
  innings?: any;
  currentMatch?: any;
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

const Batsmenrow = ({ innings, currentMatch }: BatsmenRowProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const battingKey = innings?.battingTeam as 'teamA' | 'teamB' | undefined;

  const strikerId: number | null | undefined = innings?.strikerId;
  const nonStrikerId: number | null | undefined = innings?.nonStrikerId;

  const battingPlayers = useMemo(() => {
    return battingKey ? currentMatch?.[battingKey]?.players ?? [] : [];
  }, [battingKey, currentMatch]);

  const batsmenData = useMemo(() => {
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
  }, [battingPlayers, strikerId, nonStrikerId]);

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
                {getOutText(item, currentMatch, innings, battingKey)}
              </ThemeText>
            </View>
            <View style={styles.right}>
              <ThemeText style={styles.num} color="text">
                {item?.runs ?? 0}
              </ThemeText>
              <ThemeText style={styles.num} color="text">
                {item?.balls ?? 0}
              </ThemeText>
              <ThemeText style={styles.sr} color="desText">
                {calcStrikeRate(item?.runs, item?.balls)}
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
