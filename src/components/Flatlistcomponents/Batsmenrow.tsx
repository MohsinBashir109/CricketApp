import { FlatList, StyleSheet, View } from 'react-native';
import React, { useMemo } from 'react';
import { heightPixel, widthPixel } from '../../utils/constants';

import ThemeText from '../ThemeText';

interface BatsmenRowProps {
  innings?: any;
  currentMatch?: any;
}

const calcStrikeRate = (runs?: number, balls?: number) => {
  if (!balls || balls <= 0) return '--';
  return (((runs ?? 0) / balls) * 100).toFixed(2);
};

// Build scorecard-style out text using your fields.
// (You can customize this later)
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

  // Some common formats:
  // caught: c Fielder b Bowler
  if (type === 'caught' || type === 'c') {
    return `c ${fielder?.name ?? 'fielder'} b ${bowler?.name ?? 'bowler'}`;
  }

  // bowled: b Bowler
  if (type === 'bowled' || type === 'b') {
    return `b ${bowler?.name ?? 'bowler'}`;
  }

  // lbw: lbw b Bowler
  if (type === 'lbw') {
    return `lbw b ${bowler?.name ?? 'bowler'}`;
  }

  // run out: run out (Fielder)
  if (type === 'run out' || type === 'runout') {
    return `run out (${fielder?.name ?? 'fielder'})`;
  }

  // stumped: st Fielder b Bowler (usually keeper as fielder)
  if (type === 'stumped' || type === 'st') {
    return `st ${fielder?.name ?? 'keeper'} b ${bowler?.name ?? 'bowler'}`;
  }

  // fallback
  return (player?.outType ?? 'out').toString();
};

const Batsmenrow = ({ innings, currentMatch }: BatsmenRowProps) => {
  const battingKey = innings?.battingTeam as 'teamA' | 'teamB' | undefined;

  const strikerId: number | null | undefined = innings?.strikerId;
  const nonStrikerId: number | null | undefined = innings?.nonStrikerId;

  const battingPlayers = useMemo(() => {
    return battingKey ? currentMatch?.[battingKey]?.players ?? [] : [];
  }, [battingKey, currentMatch]);

  //  Data for FlatList: current batsmen + anyone who batted + anyone who is out
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

  const renderItem = ({ item }: { item: any }) => {
    const isStriker = item.id === strikerId;

    return (
      <View style={styles.row}>
        <View style={styles.left}>
          <ThemeText color="text" numberOfLines={1}>
            {item?.name ?? '—'}
            {isStriker ? ' *' : ''}
          </ThemeText>

          <ThemeText color="text" style={styles.outText} numberOfLines={1}>
            {getOutText(item, currentMatch, innings, battingKey)}
          </ThemeText>
        </View>

        <View style={styles.right}>
          <View style={styles.colR}>
            <ThemeText color="text">{item?.runs ?? 0}</ThemeText>
          </View>

          <View style={styles.colB}>
            <ThemeText color="text">{item?.balls ?? 0}</ThemeText>
          </View>

          <View style={styles.colSR}>
            <ThemeText color="text">
              {calcStrikeRate(item?.runs, item?.balls)}
            </ThemeText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ height: heightPixel(150) }}>
      <FlatList
        data={batsmenData}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        scrollEnabled={true}
        contentContainerStyle={{ flexGrow: 0 }}
        ListEmptyComponent={
          <View
            style={{
              paddingHorizontal: widthPixel(20),
              paddingVertical: 10,
            }}
          >
            <ThemeText color="text">No batsmen yet</ThemeText>
          </View>
        }
      />
    </View>
  );
};

export default Batsmenrow;

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

  // Match your spacing style
  colR: { width: widthPixel(50), alignItems: 'flex-end' },
  colB: { width: widthPixel(50), alignItems: 'flex-end' },
  colSR: { width: widthPixel(60), alignItems: 'flex-end' },

  outText: { opacity: 0.7, fontSize: 12, marginTop: 2 },
});
