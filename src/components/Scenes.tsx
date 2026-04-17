import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants'; // ✅ adjust path if needed

import ThemeText from './ThemeText'; // ✅ adjust path if needed
import { colors } from '../utils/colors'; // ✅ adjust path if needed
import { fontFamilies } from '../utils/fontfamilies'; // ✅ adjust path if needed
import { useThemeContext } from '../theme/themeContext'; // ✅ adjust path if needed

// ---------------- helpers ----------------
const formatOversFromBalls = (totalBalls: number) => {
  const ovs = Math.floor((totalBalls || 0) / 6);
  const balls = (totalBalls || 0) % 6;
  return `${ovs}.${balls}`;
};

const calcRR = (runs: number, balls: number) => {
  const overs = (balls || 0) / 6;
  if (!overs) return '0.00';
  return (runs / overs).toFixed(2);
};

const calcSR = (runs: number, balls: number) => {
  if (!balls) return '0.0';
  return ((runs / balls) * 100).toFixed(1);
};

// overs stored like 1.4 (1 over 4 balls)
const overDotBallToBalls = (oversLike: number | null) => {
  if (!oversLike) return 0;
  const [oStr, bStr = '0'] = String(oversLike).split('.');
  const o = Number(oStr || 0);
  const b = Number(bStr || 0);
  return o * 6 + b;
};

const calcEcon = (runs: number, balls: number) => {
  if (!balls) return '0.00';
  return (runs / (balls / 6)).toFixed(2);
};

const getPlayerName = (players: any[], id: number) => {
  const p = players?.find((x: any) => x?.id === id);
  return p?.name ?? `#${id}`;
};

// ---------------- core reusable UI ----------------
const InningsScorecard = ({
  match,
  fullMatch,
}: {
  match: any;
  fullMatch: any;
}) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const computed = useMemo(() => {
    if (!match || !fullMatch) {
      return {
        batters: [],
        didNotBat: [],
        bowlers: [],
        extras: 0,
        fow: [] as string[],
        rr: '0.00',
        oversText: '0.0',
      };
    }

    const battingPlayers = fullMatch?.[match?.battingTeam]?.players ?? [];
    const bowlingPlayers = fullMatch?.[match?.bowlingTeam]?.players ?? [];

    // show only those who batted / got out
    const batters = battingPlayers.filter(
      (p: any) => (p?.balls ?? 0) > 0 || (p?.runs ?? 0) > 0 || p?.isOut,
    );

    const didNotBat = battingPlayers.filter(
      (p: any) => !batters.some((b: any) => b.id === p.id),
    );

    // show bowlers who have any bowling numbers
    const bowlers = bowlingPlayers.filter((p: any) => {
      const bowledBalls = overDotBallToBalls(p?.overs ?? null);
      return bowledBalls > 0 || (p?.wickets ?? 0) > 0 || (p?.conceded ?? 0) > 0;
    });

    const extras = (match?.balls ?? []).reduce(
      (sum: number, b: any) => sum + (b?.extraRuns ?? 0),
      0,
    );

    // Fall of wickets from innings balls
    let runningRuns = 0;
    let runningWkts = 0;
    const fow: string[] = [];

    for (const b of match?.balls ?? []) {
      runningRuns += b?.runs ?? 0;
      if (b?.wicket) {
        runningWkts += 1;
        const batterName = getPlayerName(battingPlayers, b?.strikerId);
        fow.push(
          `${runningRuns}/${runningWkts} (${batterName}, ${b?.over}.${b?.ballInOver})`,
        );
      }
    }

    return {
      batters,
      didNotBat,
      bowlers,
      extras,
      fow,
      rr: calcRR(match?.totalRuns ?? 0, match?.totalBalls ?? 0),
      oversText: formatOversFromBalls(match?.totalBalls ?? 0),
    };
  }, [match, fullMatch]);

  if (!match) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemeText color="secondaryText">No innings data</ThemeText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 18 }}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemeText style={styles.headerTitle} color="text">
          {match.battingTeamName} innings
        </ThemeText>

        <View style={styles.headerRow}>
          <ThemeText style={styles.score} color="text">
            {match.totalRuns}-{match.totalWickets}
          </ThemeText>

          <View style={{ alignItems: 'flex-end' }}>
            <ThemeText style={styles.headerMeta} color="secondaryText">
              Overs {computed.oversText}
            </ThemeText>
            <ThemeText style={styles.headerMeta} color="secondaryText">
              RR {computed.rr}
            </ThemeText>
          </View>
        </View>

        <View style={styles.headerRow2}>
          <ThemeText style={styles.headerSub} color="secondaryText">
            vs {match.bowlingTeamName}
          </ThemeText>

          <View
            style={[
              styles.pill,
              {
                borderColor: match.isCompleted ? theme.border : theme.accent,
                backgroundColor: match.isCompleted
                  ? theme.surfaceElevated
                  : theme.primaryMuted,
              },
            ]}
          >
            <ThemeText
              style={styles.pillText}
              color={match.isCompleted ? 'secondaryText' : 'primary'}
            >
              {match.isCompleted ? 'Completed' : 'Live'}
            </ThemeText>
          </View>
        </View>
      </View>

      {/* BATSMEN CARD */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemeText style={styles.cardTitle} color="text">
          Batsmen
        </ThemeText>

        <View
          style={[
            styles.tableHeader,
            {
              borderBottomColor: theme.border,
              backgroundColor: theme.primaryMuted,
            },
          ]}
        >
          <ThemeText style={[styles.th, styles.nameCol]} color="primary">
            Name
          </ThemeText>
          <ThemeText style={[styles.th, styles.numCol]} color="primary">
            R
          </ThemeText>
          <ThemeText style={[styles.th, styles.numCol]} color="primary">
            B
          </ThemeText>
          <ThemeText style={[styles.th, styles.numCol]} color="primary">
            4s
          </ThemeText>
          <ThemeText style={[styles.th, styles.numCol]} color="primary">
            6s
          </ThemeText>
          <ThemeText style={[styles.th, styles.srCol]} color="primary">
            SR
          </ThemeText>
        </View>

        {computed.batters.map((p: any) => (
          <View
            key={p.id}
            style={[styles.row, { borderBottomColor: theme.border }]}
          >
            <View style={styles.nameCol}>
              <ThemeText
                style={styles.playerName}
                color="text"
                numberOfLines={1}
              >
                {p.name}
              </ThemeText>
              <ThemeText style={styles.playerSub} color="secondaryText">
                {p.isOut ? 'out' : 'not out'}
              </ThemeText>
            </View>

            <ThemeText style={[styles.td, styles.numCol]} color="text">
              {p.runs ?? 0}
            </ThemeText>
            <ThemeText style={[styles.td, styles.numCol]} color="text">
              {p.balls ?? 0}
            </ThemeText>
            <ThemeText style={[styles.td, styles.numCol]} color="text">
              {p.fours ?? 0}
            </ThemeText>
            <ThemeText style={[styles.td, styles.numCol]} color="text">
              {p.sixes ?? 0}
            </ThemeText>
            <ThemeText style={[styles.td, styles.srCol]} color="text">
              {calcSR(p.runs ?? 0, p.balls ?? 0)}
            </ThemeText>
          </View>
        ))}

        {computed.didNotBat.length > 0 && (
          <ThemeText style={styles.didNotBat} color="secondaryText">
            Did not bat: {computed.didNotBat.map((p: any) => p.name).join(', ')}
          </ThemeText>
        )}
      </View>

      {/* BOWLERS CARD */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            marginVertical: heightPixel(20),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemeText style={styles.cardTitle} color="text">
          Bowlers
        </ThemeText>

        <View
          style={[
            styles.tableHeader,
            {
              borderBottomColor: theme.border,
              backgroundColor: theme.primaryMuted,
            },
          ]}
        >
          <ThemeText style={[styles.th, styles.nameCol]} color="primary">
            Name
          </ThemeText>
          <ThemeText style={[styles.th, styles.numCol]} color="primary">
            O
          </ThemeText>
          <ThemeText style={[styles.th, styles.numCol]} color="primary">
            R
          </ThemeText>
          <ThemeText style={[styles.th, styles.numCol]} color="primary">
            W
          </ThemeText>
          <ThemeText style={[styles.th, styles.srCol]} color="primary">
            Econ
          </ThemeText>
        </View>

        {computed.bowlers.map((p: any) => {
          const bowledBalls = overDotBallToBalls(p?.overs ?? null);
          const conceded = p?.conceded ?? 0;
          return (
            <View
              key={p.id}
            style={[styles.row, { borderBottomColor: theme.border }]}
          >
            <View style={styles.nameCol}>
              <ThemeText
                style={styles.playerName}
                color="text"
                numberOfLines={1}
              >
                {p.name}
              </ThemeText>
              <ThemeText
                style={styles.playerSub}
                color="secondaryText"
                numberOfLines={1}
              >
                {p.role}
              </ThemeText>
            </View>

              <ThemeText style={[styles.td, styles.numCol]} color="text">
                {p.overs ?? '0.0'}
              </ThemeText>
              <ThemeText style={[styles.td, styles.numCol]} color="text">
                {conceded}
              </ThemeText>
              <ThemeText style={[styles.td, styles.numCol]} color="text">
                {p.wickets ?? 0}
              </ThemeText>
              <ThemeText style={[styles.td, styles.srCol]} color="text">
                {calcEcon(conceded, bowledBalls)}
              </ThemeText>
            </View>
          );
        })}
      </View>

      {/* FALL OF WICKETS */}
      {computed.fow.length > 0 && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemeText style={styles.cardTitle} color="text">
            Fall of Wickets
          </ThemeText>

          {computed.fow.map((line: string, idx: number) => (
            <View
              key={`${line}-${idx}`}
              style={[styles.fowRow, { borderBottomColor: theme.border }]}
            >
              <ThemeText style={styles.fowText} color="secondaryText">
                {line}
              </ThemeText>
            </View>
          ))}
        </View>
      )}

      {/* FOOTER */}
      <View
        style={[
          styles.footer,
          {
            borderColor: theme.border,
            backgroundColor: theme.surfaceElevated,
          },
        ]}
      >
        <ThemeText color="text" style={styles.extrasFooter}>
          Extras: {computed.extras}
        </ThemeText>
      </View>
    </ScrollView>
  );
};

// ---------------- exported routes ----------------
export const Innings1Route = ({
  match,
  fullMatch,
}: {
  match: any;
  fullMatch: any;
}) => {
  return <InningsScorecard match={match} fullMatch={fullMatch} />;
};

export const Innings2Route = ({
  match,
  fullMatch,
}: {
  match: any;
  fullMatch: any;
}) => {
  return <InningsScorecard match={match} fullMatch={fullMatch} />;
};

export default Innings1Route;

// ---------------- styles ----------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(14),
    paddingBottom: heightPixel(12),
    marginHorizontal: widthPixel(12),
    marginTop: heightPixel(12),
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
    marginBottom: heightPixel(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  score: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(26),
  },
  headerMeta: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    opacity: 0.9,
  },
  headerRow2: {
    marginTop: heightPixel(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSub: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    opacity: 0.9,
  },

  pill: {
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(4),
    borderRadius: widthPixel(999),
    borderWidth: 1,
  },
  pillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },

  card: {
    // marginTop: 12,
    borderRadius: widthPixel(12),
    paddingHorizontal: widthPixel(10),
  },
  cardTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
    marginBottom: heightPixel(10),
  },

  tableHeader: {
    flexDirection: 'row',
    // paddingBottom: 8,
    borderBottomWidth: 1,
  },
  th: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    opacity: 0.85,
  },

  row: {
    flexDirection: 'row',
    paddingVertical: heightPixel(10),
    borderBottomWidth: 1,
  },
  td: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },

  nameCol: { flex: 1.7 },
  numCol: { flex: 0.55, textAlign: 'right' },
  srCol: { flex: 0.8, textAlign: 'right' },

  playerName: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  playerSub: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(11),
    opacity: 0.85,
    marginTop: heightPixel(2),
  },

  didNotBat: {
    marginTop: heightPixel(10),
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(12),
    opacity: 0.9,
  },

  fowRow: {
    paddingVertical: heightPixel(10),
    borderBottomWidth: 1,
  },
  fowText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(12),
    opacity: 0.9,
  },

  footer: {
    marginTop: heightPixel(12),
    marginHorizontal: widthPixel(12),
    padding: widthPixel(12),
    borderRadius: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
  },
  extrasFooter: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});
