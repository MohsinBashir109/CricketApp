import { Pressable, StyleSheet, View } from 'react-native';
import React, { useMemo } from 'react';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import {
  aggregateBowlingFromBalls,
  formatBowlerOversFromLegalBalls,
} from '../../utils/inningsStatsFromBalls';

import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

interface BowlerRowProps {
  innings?: any;
  currentMatch?: any;
  /** When set, drives ball-only stats row (Super Over); when unset, uses currentInnings 3/4. */
  useInningsBallsOnlyStats?: boolean;
  onPressAdd?: () => void;
  computed?: any;
}

const calcEcon = (runs?: number, oversVal?: string | number | null) => {
  if (oversVal === null || oversVal === undefined) return '--';

  const oversStr =
    typeof oversVal === 'number' ? oversVal.toString() : oversVal;
  if (!oversStr || typeof oversStr !== 'string') return '--';

  const [oStr, bStr] = oversStr.split('.');
  const overs = Number(oStr || 0);
  const balls = Number(bStr || 0);

  const safeBalls = Number.isFinite(balls)
    ? Math.min(Math.max(balls, 0), 5)
    : 0;

  const totalBalls = overs * 6 + safeBalls;
  if (!Number.isFinite(totalBalls) || totalBalls <= 0) return '--';

  const econ = (runs ?? 0) / (totalBalls / 6);
  return Number.isFinite(econ) ? econ.toFixed(2) : '--';
};

const hasBowled = (p: any) => {
  const o = p?.overs;
  if (o === null || o === undefined) return false;
  const s = typeof o === 'number' ? o.toString() : o;
  return typeof s === 'string' && s !== '0.0' && s !== '0' && s.trim() !== '';
};

const Bowlerow = ({
  innings,
  currentMatch,
  useInningsBallsOnlyStats,
  onPressAdd,
  computed,
}: BowlerRowProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const bowlingKey = innings?.bowlingTeam as 'teamA' | 'teamB' | undefined;
  const ci = currentMatch?.currentInnings ?? 1;
  const isSuperOverInnings =
    useInningsBallsOnlyStats !== undefined
      ? useInningsBallsOnlyStats
      : ci === 3 || ci === 4;

  const bowlingPlayers = useMemo(() => {
    return bowlingKey ? currentMatch?.[bowlingKey]?.players ?? [] : [];
  }, [bowlingKey, currentMatch]);

  const soBowlAgg = useMemo(
    () =>
      isSuperOverInnings
        ? aggregateBowlingFromBalls(innings?.balls)
        : null,
    [isSuperOverInnings, innings?.balls],
  );

  const currentBowler =
    bowlingPlayers.find(
      (p: any) => String(p.id) === String(innings?.bowlerId),
    ) ?? null;

  const bowlersData = useMemo(() => {
    if (isSuperOverInnings && soBowlAgg) {
      const map = new Map<string, any>();
      for (const p of bowlingPlayers) {
        const agg = soBowlAgg.get(p.id);
        const isCurrent = String(p.id) === String(innings?.bowlerId);
        if (!agg && !isCurrent) continue;
        const legal = agg?.legalBallsBowled ?? 0;
        const oversStr =
          legal > 0 || isCurrent
            ? formatBowlerOversFromLegalBalls(legal)
            : '0.0';
        map.set(String(p.id), {
          ...p,
          overs: oversStr,
          maidens: 0,
          conceded: agg?.conceded ?? 0,
          wickets: agg?.wickets ?? 0,
        });
      }
      const arr = Array.from(map.values());
      arr.sort((a, b) =>
        String(a.id) === String(innings?.bowlerId)
          ? -1
          : String(b.id) === String(innings?.bowlerId)
            ? 1
            : 0,
      );
      return arr;
    }

    const previous = bowlingPlayers.filter(hasBowled);

    const map = new Map<string, any>();

    if (currentBowler?.id != null)
      map.set(String(currentBowler.id), currentBowler);

    previous.forEach((p: any) => map.set(String(p.id), p));

    const arr = Array.from(map.values());

    arr.sort((a, b) =>
      String(a.id) === String(currentBowler?.id)
        ? -1
        : String(b.id) === String(currentBowler?.id)
          ? 1
          : 0,
    );

    return arr;
  }, [
    bowlingPlayers,
    currentBowler,
    isSuperOverInnings,
    soBowlAgg,
    innings?.bowlerId,
  ]);

  if (bowlersData.length === 0) {
    return (
      <Pressable
        onPress={onPressAdd}
        disabled={!onPressAdd}
        style={styles.empty}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ThemeText color="secondaryText">No bowler selected</ThemeText>
        {onPressAdd ? (
          <ThemeText color="primary" style={styles.emptyLinkText}>
            + Add bowler
          </ThemeText>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View style={styles.list}>
      {bowlersData.map((item: any) => {
        const isCurrent = String(item?.id) === String(currentBowler?.id);
        const computedRow = !isSuperOverInnings ? computed?.bowling?.get?.(item.id) : null;
        const dispOvers = isSuperOverInnings ? item?.overs : (computedRow?.overs ?? item?.overs);
        const dispConceded = isSuperOverInnings ? item?.conceded : (computedRow?.conceded ?? item?.conceded);
        const dispWickets = isSuperOverInnings ? item?.wickets : (computedRow?.wickets ?? item?.wickets);
        return (
          <View
            key={String(item.id)}
            style={[
              styles.row,
              isCurrent && {
                backgroundColor: theme.primaryMuted,
                borderRadius: widthPixel(12),
              },
            ]}
          >
            <View style={styles.left}>
              <ThemeText color="text" numberOfLines={1} style={styles.name}>
                {item?.name ?? '—'}
                {isCurrent ? (
                  <ThemeText color="primary" style={styles.bowlMark}>
                    {' '}
                    •
                  </ThemeText>
                ) : null}
              </ThemeText>
            </View>

            <View style={styles.right}>
              <ThemeText style={styles.cell} color="text">
                {dispOvers ?? '0.0'}
              </ThemeText>
              <ThemeText style={styles.cell} color="text">
                {item?.maidens ?? 0}
              </ThemeText>
              <ThemeText style={styles.cell} color="text">
                {dispConceded ?? 0}
              </ThemeText>
              <ThemeText style={styles.cell} color="text">
                {dispWickets ?? 0}
              </ThemeText>
              <ThemeText style={styles.econ} color="desText">
                {calcEcon(dispConceded ?? 0, dispOvers)}
              </ThemeText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default Bowlerow;

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: widthPixel(12),
    paddingBottom: heightPixel(10),
  },
  row: {
    width: '100%',
    paddingHorizontal: widthPixel(8),
    paddingVertical: heightPixel(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: { flex: 1, paddingRight: widthPixel(8) },
  right: { flexDirection: 'row', alignItems: 'center' },
  name: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(15),
  },
  bowlMark: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
  },
  cell: {
    width: widthPixel(40),
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  econ: {
    width: widthPixel(52),
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
  empty: {
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(16),
  },
  emptyLinkText: {
    marginTop: heightPixel(6),
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
});
