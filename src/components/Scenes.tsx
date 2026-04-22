import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';

import ThemeText from './ThemeText';
import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';
import { useThemeContext } from '../theme/themeContext';
import BatsmenBowlerScorringHeader from './Headers/BatsmenScorringHeader';
import {
  aggregateBattingFromBalls,
  aggregateBowlingFromBalls,
  formatBowlerOversFromLegalBalls,
} from '../utils/inningsStatsFromBalls';

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

const getPlayerName = (players: any[], id: number | null | undefined) => {
  if (id == null || !Number.isFinite(Number(id))) return '—';
  const p = players?.find((x: any) => x?.id === id);
  return p?.name ?? `#${id}`;
};

type StatsSource = 'teamPlayers' | 'inningsBalls';

// ---------------- core reusable UI ----------------
const InningsScorecard = ({
  match,
  fullMatch,
  statsSource = 'teamPlayers',
  headerTitle,
  layout = 'screen',
}: {
  match: any;
  fullMatch: any;
  statsSource?: StatsSource;
  /** When set, replaces the default "{battingTeam} innings" title. */
  headerTitle?: string;
  /** `embedded` = no outer ScrollView (parent provides scroll). */
  layout?: 'screen' | 'embedded';
}) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const computed = useMemo(() => {
    if (!match || !fullMatch) {
      return {
        batters: [] as any[],
        didNotBat: [] as any[],
        bowlers: [] as any[],
        extras: 0,
        fow: [] as string[],
        rr: '0.00',
        oversText: '0.0',
      };
    }

    const battingPlayers = fullMatch?.[match?.battingTeam]?.players ?? [];
    const bowlingPlayers = fullMatch?.[match?.bowlingTeam]?.players ?? [];

    const extras = (match?.balls ?? []).reduce(
      (sum: number, b: any) => sum + (b?.extraRuns ?? 0),
      0,
    );

    let runningRuns = 0;
    let runningWkts = 0;
    const fow: string[] = [];

    const pushFow = (battingPlayersList: any[], balls: any[]) => {
      for (const b of balls ?? []) {
        runningRuns += b?.runs ?? 0;
        if (b?.wicket) {
          runningWkts += 1;
          const who =
            b?.dismissedBatsmanId != null
              ? b.dismissedBatsmanId
              : b?.strikerId;
          const batterName = getPlayerName(battingPlayersList, who);
          const ov = b?.ballInOver ? `${b?.over}.${b?.ballInOver}` : `${b?.over}.0`;
          fow.push(`${runningRuns}/${runningWkts} (${batterName}, ${ov})`);
        }
      }
    };

    if (statsSource === 'inningsBalls') {
      const batAgg = aggregateBattingFromBalls(match?.balls);
      const dismissed = new Set<number>();
      for (const b of match?.balls ?? []) {
        if (b?.wicket && b?.dismissedBatsmanId != null) {
          dismissed.add(b.dismissedBatsmanId);
        }
      }
      const batterIds = new Set<number>([...batAgg.keys(), ...dismissed]);
      const batters = [...batterIds].map(id => {
        const p = battingPlayers.find((x: any) => x.id === id);
        const a = batAgg.get(id);
        return {
          id,
          name: p?.name ?? `#${id}`,
          runs: a?.runs ?? 0,
          balls: a?.balls ?? 0,
          fours: a?.fours ?? 0,
          sixes: a?.sixes ?? 0,
          isOut: dismissed.has(id),
          role: p?.role,
        };
      });
      batters.sort((a, b) => (b.runs ?? 0) - (a.runs ?? 0) || a.id - b.id);

      const didNotBat = battingPlayers.filter(
        (p: any) => !batterIds.has(p.id),
      );

      const bowlAgg = aggregateBowlingFromBalls(match?.balls);
      const bowlers = [...bowlAgg.entries()]
        .filter(
          ([, agg]) =>
            agg.legalBallsBowled > 0 ||
            agg.conceded > 0 ||
            agg.wickets > 0,
        )
        .map(([id, agg]) => {
          const p = bowlingPlayers.find((x: any) => x.id === id);
          return {
            id,
            name: p?.name ?? `#${id}`,
            overs: formatBowlerOversFromLegalBalls(agg.legalBallsBowled),
            maidens: 0,
            conceded: agg.conceded,
            wickets: agg.wickets,
            role: p?.role,
          };
        });

      pushFow(battingPlayers, match?.balls);

      return {
        batters,
        didNotBat,
        bowlers,
        extras,
        fow,
        rr: calcRR(match?.totalRuns ?? 0, match?.totalBalls ?? 0),
        oversText: formatOversFromBalls(match?.totalBalls ?? 0),
      };
    }

    const batters = battingPlayers.filter(
      (p: any) => (p?.balls ?? 0) > 0 || (p?.runs ?? 0) > 0 || p?.isOut,
    );

    const didNotBat = battingPlayers.filter(
      (p: any) => !batters.some((b: any) => b.id === p.id),
    );

    const bowlers = bowlingPlayers.filter((p: any) => {
      const bowledBalls = overDotBallToBalls(p?.overs ?? null);
      return bowledBalls > 0 || (p?.wickets ?? 0) > 0 || (p?.conceded ?? 0) > 0;
    });

    pushFow(battingPlayers, match?.balls);

    return {
      batters,
      didNotBat,
      bowlers,
      extras,
      fow,
      rr: calcRR(match?.totalRuns ?? 0, match?.totalBalls ?? 0),
      oversText: formatOversFromBalls(match?.totalBalls ?? 0),
    };
  }, [match, fullMatch, statsSource]);

  if (!match) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemeText color="secondaryText">No innings data</ThemeText>
      </View>
    );
  }

  const scorecardHeading =
    headerTitle ?? `${match.battingTeamName ?? 'Batting'} innings`;

  const body = (
    <>
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
          {scorecardHeading}
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

      {/* BATSMEN — same header pattern as live scoring; brand accent strip */}
      <View
        style={[
          styles.scoreCardShell,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderLeftColor: theme.primary,
          },
        ]}
      >
        <View style={styles.scoreCardHeaderPad}>
          <BatsmenBowlerScorringHeader title="Batsmen" variant="batting" />
        </View>
        {computed.batters.length === 0 ? (
          <View style={styles.emptyBat}>
            <ThemeText color="secondaryText">No batting data</ThemeText>
          </View>
        ) : (
          computed.batters.map((p: any) => (
            <View
              key={p.id}
              style={[styles.batRow, { borderBottomColor: theme.border }]}
            >
              <View style={styles.batNameBlock}>
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
              <View style={styles.batNums}>
                <ThemeText style={styles.batNumCell} color="text">
                  {p.runs ?? 0}
                </ThemeText>
                <ThemeText style={styles.batNumCell} color="text">
                  {p.balls ?? 0}
                </ThemeText>
                <ThemeText style={styles.batSrCell} color="desText">
                  {calcSR(p.runs ?? 0, p.balls ?? 0)}
                </ThemeText>
              </View>
            </View>
          ))
        )}

        {computed.didNotBat.length > 0 && (
          <ThemeText
            style={[styles.didNotBat, styles.didNotBatPad]}
            color="secondaryText"
          >
            Did not bat: {computed.didNotBat.map((p: any) => p.name).join(', ')}
          </ThemeText>
        )}
      </View>

      {/* BOWLERS — gold accent strip + O M R W Econ columns like scoring */}
      <View
        style={[
          styles.scoreCardShell,
          styles.scoreCardShellBowling,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderLeftColor: theme.accent,
          },
        ]}
      >
        <View style={styles.scoreCardHeaderPad}>
          <BatsmenBowlerScorringHeader title="Bowler" variant="bowling" />
        </View>
        {computed.bowlers.length === 0 ? (
          <View style={styles.emptyBat}>
            <ThemeText color="secondaryText">No bowling data</ThemeText>
          </View>
        ) : (
          computed.bowlers.map((p: any) => {
            const oversVal = p?.overs;
            const bowledBalls =
              typeof oversVal === 'number'
                ? overDotBallToBalls(oversVal)
                : overDotBallToBalls(oversVal ?? null);
            const conceded = p?.conceded ?? 0;
            const oversDisplay =
              oversVal === null || oversVal === undefined
                ? '0.0'
                : String(oversVal);
            return (
              <View
                key={p.id}
                style={[styles.bowlRow, { borderBottomColor: theme.border }]}
              >
                <View style={styles.bowlNameBlock}>
                  <ThemeText
                    style={styles.playerName}
                    color="text"
                    numberOfLines={1}
                  >
                    {p.name}
                  </ThemeText>
                  {p.role ? (
                    <ThemeText
                      style={styles.playerSub}
                      color="secondaryText"
                      numberOfLines={1}
                    >
                      {p.role}
                    </ThemeText>
                  ) : null}
                </View>
                <View style={styles.bowlNums}>
                  <ThemeText style={styles.bowlNumCell} color="text">
                    {oversDisplay}
                  </ThemeText>
                  <ThemeText style={styles.bowlNumCell} color="text">
                    {p.maidens ?? 0}
                  </ThemeText>
                  <ThemeText style={styles.bowlNumCell} color="text">
                    {conceded}
                  </ThemeText>
                  <ThemeText style={styles.bowlNumCell} color="text">
                    {p.wickets ?? 0}
                  </ThemeText>
                  <ThemeText style={styles.bowlEconCell} color="desText">
                    {calcEcon(conceded, bowledBalls)}
                  </ThemeText>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* FALL OF WICKETS */}
      {computed.fow.length > 0 && (
        <View
          style={[
            styles.auxCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemeText style={styles.fowCardTitle} color="text">
            Fall of wickets
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
    </>
  );

  if (layout === 'embedded') {
    return <View style={{ width: '100%' }}>{body}</View>;
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {body}
    </ScrollView>
  );
};

function teamRunsSoPair(
  i1: any,
  i2: any,
  team: 'teamA' | 'teamB',
): number {
  let r = 0;
  if (i1?.battingTeam === team) r += i1.totalRuns ?? 0;
  if (i2?.battingTeam === team) r += i2.totalRuns ?? 0;
  return r;
}

// ---------------- Super Over summary (ball-based rows; totals banner) ----------------
export const SuperOverSummaryRoute = ({
  fullMatch,
}: {
  fullMatch: any;
}) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const so1 = fullMatch?.superOverInnings1;
  const so2 = fullMatch?.superOverInnings2;
  const history = (fullMatch?.superOverHistory ?? []) as {
    inning1: any;
    inning2: any;
  }[];
  const historyLen = history.length;
  const teamAName = fullMatch?.teamA?.name ?? 'Team A';
  const teamBName = fullMatch?.teamB?.name ?? 'Team B';

  const currentPairComplete = !!(so1?.isCompleted && so2?.isCompleted);

  const { runsA, runsB, roundCount } = useMemo(() => {
    const hist = (fullMatch?.superOverHistory ?? []) as {
      inning1: any;
      inning2: any;
    }[];
    const i1 = fullMatch?.superOverInnings1;
    const i2 = fullMatch?.superOverInnings2;
    const pairDone = !!(i1?.isCompleted && i2?.isCompleted);
    if (pairDone) {
      return {
        runsA: teamRunsSoPair(i1, i2, 'teamA'),
        runsB: teamRunsSoPair(i1, i2, 'teamB'),
        roundCount: hist.length + 1,
      };
    }
    if (hist.length > 0) {
      const last = hist[hist.length - 1];
      return {
        runsA: teamRunsSoPair(last.inning1, last.inning2, 'teamA'),
        runsB: teamRunsSoPair(last.inning1, last.inning2, 'teamB'),
        roundCount: hist.length,
      };
    }
    return { runsA: 0, runsB: 0, roundCount: 0 };
  }, [fullMatch, historyLen, so1, so2, currentPairComplete]);

  if (!history.length && !so1 && !so2) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemeText color="secondaryText">No Super Over was played</ThemeText>
      </View>
    );
  }

  const winnerLine =
    fullMatch?.tieResolvedBy === 'super_over' && fullMatch?.winnerTeamName
      ? `${fullMatch.winnerTeamName} won the Super Over`
      : fullMatch?.tieResolvedBy === 'super_over_tied'
        ? 'Super Over tied — result per match rules'
        : null;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View
        style={[
          styles.soBanner,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemeText style={styles.soBannerTitle} color="text">
          Super Over
        </ThemeText>
        {roundCount > 1 ? (
          <ThemeText style={styles.soRoundsMeta} color="secondaryText">
            {roundCount} tie-break rounds played
          </ThemeText>
        ) : null}
        <View style={styles.soBannerRow}>
          <View style={styles.soTeamCol}>
            <ThemeText
              style={styles.soTeamLabel}
              color="secondaryText"
              numberOfLines={1}
            >
              {teamAName}
            </ThemeText>
            <ThemeText style={styles.soTeamScore} color="text">
              {runsA}
            </ThemeText>
          </View>
          <ThemeText style={styles.soVs} color="desText">
            vs
          </ThemeText>
          <View style={[styles.soTeamCol, { alignItems: 'flex-end' }]}>
            <ThemeText
              style={styles.soTeamLabel}
              color="secondaryText"
              numberOfLines={1}
            >
              {teamBName}
            </ThemeText>
            <ThemeText style={styles.soTeamScore} color="text">
              {runsB}
            </ThemeText>
          </View>
        </View>
        <ThemeText style={styles.soBannerHint} color="desText">
          {currentPairComplete
            ? 'Scores below are for the latest / deciding Super Over pair.'
            : 'Scores below are for the last completed Super Over pair.'}
        </ThemeText>
        {winnerLine ? (
          <ThemeText style={styles.soResult} color="primary">
            {winnerLine}
          </ThemeText>
        ) : null}
      </View>

      {history.map((round, idx) => (
        <View key={`so-hist-${idx}`}>
          <ThemeText style={styles.soSectionLabel} color="secondaryText">
            Super Over round {idx + 1}
          </ThemeText>
          <InningsScorecard
            match={round.inning1}
            fullMatch={fullMatch}
            statsSource="inningsBalls"
            layout="embedded"
            headerTitle={`${round.inning1.battingTeamName} · 1st innings`}
          />
          <InningsScorecard
            match={round.inning2}
            fullMatch={fullMatch}
            statsSource="inningsBalls"
            layout="embedded"
            headerTitle={`${round.inning2.battingTeamName} · 2nd innings`}
          />
        </View>
      ))}

      {so1 ? (
        <View key="so-current-1">
          <ThemeText style={styles.soSectionLabel} color="secondaryText">
            Super Over round {history.length + 1} — 1st innings
          </ThemeText>
          <InningsScorecard
            match={so1}
            fullMatch={fullMatch}
            statsSource="inningsBalls"
            layout="embedded"
            headerTitle={`${so1.battingTeamName} · Super Over (1st)`}
          />
        </View>
      ) : null}

      {so2 ? (
        <View key="so-current-2">
          <ThemeText style={styles.soSectionLabel} color="secondaryText">
            Super Over round {history.length + 1} — 2nd innings
          </ThemeText>
          <InningsScorecard
            match={so2}
            fullMatch={fullMatch}
            statsSource="inningsBalls"
            layout="embedded"
            headerTitle={`${so2.battingTeamName} · Super Over (2nd)`}
          />
        </View>
      ) : null}
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

  scrollContent: {
    paddingBottom: heightPixel(18),
  },

  scoreCardShell: {
    marginHorizontal: widthPixel(12),
    marginTop: heightPixel(12),
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    borderLeftWidth: widthPixel(4),
    paddingBottom: heightPixel(4),
  },
  scoreCardShellBowling: {
    marginTop: heightPixel(12),
  },
  scoreCardHeaderPad: {
    paddingHorizontal: widthPixel(4),
    paddingTop: heightPixel(8),
    paddingBottom: heightPixel(4),
  },

  batRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  batNameBlock: { flex: 1, paddingRight: widthPixel(8) },
  batNums: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(4),
  },
  batNumCell: {
    width: widthPixel(36),
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
  },
  batSrCell: {
    width: widthPixel(44),
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },

  bowlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bowlNameBlock: { flex: 1, paddingRight: widthPixel(8) },
  bowlNums: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(4),
  },
  bowlNumCell: {
    width: widthPixel(36),
    textAlign: 'right',
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  bowlEconCell: {
    width: widthPixel(48),
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },

  emptyBat: {
    paddingVertical: heightPixel(16),
    paddingHorizontal: widthPixel(14),
  },

  auxCard: {
    marginHorizontal: widthPixel(12),
    marginTop: heightPixel(12),
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(6),
  },
  fowCardTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(12),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: heightPixel(6),
  },

  soBanner: {
    marginHorizontal: widthPixel(12),
    marginTop: heightPixel(12),
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(16),
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
  },
  soBannerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(13),
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: heightPixel(12),
  },
  soRoundsMeta: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    marginTop: heightPixel(-4),
    marginBottom: heightPixel(10),
  },
  soBannerHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(11),
    marginTop: heightPixel(10),
    opacity: 0.88,
  },
  soBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soTeamCol: {
    flex: 1,
  },
  soTeamLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    marginBottom: heightPixel(4),
  },
  soTeamScore: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(28),
  },
  soVs: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    paddingHorizontal: widthPixel(8),
  },
  soResult: {
    marginTop: heightPixel(14),
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  soSectionLabel: {
    marginHorizontal: widthPixel(14),
    marginTop: heightPixel(16),
    marginBottom: heightPixel(6),
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

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
  didNotBatPad: {
    paddingHorizontal: widthPixel(14),
    paddingBottom: heightPixel(12),
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
