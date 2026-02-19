import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { widthPixel } from '../../utils/constants';

interface BowlerRowProps {
  innings?: any;
  currentMatch?: any;
}

const calcEcon = (runs?: number, oversVal?: string | number | null) => {
  if (oversVal === null || oversVal === undefined) return '--';

  const oversStr =
    typeof oversVal === 'number' ? oversVal.toString() : oversVal;
  if (!oversStr || typeof oversStr !== 'string') return '--';

  const [oStr, bStr] = oversStr.split('.');
  const overs = Number(oStr || 0);
  const balls = Number(bStr || 0);

  // Safety (balls 0..5)
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

const Bowlerow = ({ innings, currentMatch }: BowlerRowProps) => {
  const bowlingKey = innings?.bowlingTeam as 'teamA' | 'teamB' | undefined;

  const bowlingPlayers = useMemo(() => {
    return bowlingKey ? currentMatch?.[bowlingKey]?.players ?? [] : [];
  }, [bowlingKey, currentMatch]);

  // ✅ current bowler is found by bowlerId
  const currentBowler =
    bowlingPlayers.find(
      (p: any) => String(p.id) === String(innings?.bowlerId),
    ) ?? null;
  console.log('=====================>', currentBowler);
  // ✅ list: current bowler + previous bowlers (who already bowled)
  const bowlersData = useMemo(() => {
    const previous = bowlingPlayers.filter(hasBowled);

    const map = new Map<string, any>();

    // Always include current bowler (even if overs are null)
    if (currentBowler?.id != null)
      map.set(String(currentBowler.id), currentBowler);

    // Add previous bowlers
    previous.forEach((p: any) => map.set(String(p.id), p));

    const arr = Array.from(map.values());

    // Sort current bowler first
    arr.sort((a, b) =>
      String(a.id) === String(currentBowler?.id)
        ? -1
        : String(b.id) === String(currentBowler?.id)
        ? 1
        : 0,
    );

    return arr;
  }, [bowlingPlayers, currentBowler]);

  const renderItem = ({ item }: { item: any }) => {
    const isCurrent = String(item?.id) === String(currentBowler?.id);

    return (
      <View style={styles.row}>
        <View style={styles.left}>
          <ThemeText color="text" numberOfLines={1}>
            {item?.name ?? '—'} {isCurrent ? '*' : ''}
          </ThemeText>
        </View>

        <View style={styles.right}>
          <View style={styles.colO}>
            <ThemeText color="text">{item?.overs ?? '0.0'}</ThemeText>
          </View>

          <View style={styles.colM}>
            <ThemeText color="text">{item?.maidens ?? 0}</ThemeText>
          </View>

          <View style={styles.colR}>
            <ThemeText color="text">{item?.conceded ?? 0}</ThemeText>
          </View>

          <View style={styles.colW}>
            <ThemeText color="text">{item?.wickets ?? 0}</ThemeText>
          </View>

          <View style={styles.colE}>
            <ThemeText color="text">
              {calcEcon(item?.conceded ?? 0, item?.overs)}
            </ThemeText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={bowlersData}
      keyExtractor={item => String(item.id)}
      renderItem={renderItem}
      scrollEnabled={false}
      ListEmptyComponent={
        <View
          style={{ paddingHorizontal: widthPixel(20), paddingVertical: 10 }}
        >
          <ThemeText color="text">No bowler selected</ThemeText>
        </View>
      }
    />
  );
};

export default Bowlerow;

const styles = StyleSheet.create({
  row: {
    width: '100%',
    paddingHorizontal: widthPixel(20),
    flexDirection: 'row',
    paddingVertical: widthPixel(10),
    alignItems: 'center',
  },
  left: { flex: 1, paddingRight: widthPixel(10) },
  right: { flexDirection: 'row', alignItems: 'center' },

  colO: { width: widthPixel(55), alignItems: 'flex-end' },
  colM: { width: widthPixel(45), alignItems: 'flex-end' },
  colR: { width: widthPixel(45), alignItems: 'flex-end' },
  colW: { width: widthPixel(45), alignItems: 'flex-end' },
  colE: { width: widthPixel(60), alignItems: 'flex-end' },
});
