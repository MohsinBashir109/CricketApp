import type { Ball, Innings, MatchSetup, Player } from '../types/Playertype';
import { aggregateBattingFromBalls, aggregateBowlingFromBalls, formatBowlerOversFromLegalBalls } from './inningsStatsFromBalls';

export type ComputedInningsTotals = {
  totalRuns: number;
  totalWickets: number;
  totalLegalBalls: number;
  oversText: string;
};

export type ComputedBattingRow = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
};

export type ComputedBowlingRow = {
  overs: string;
  conceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  legalBallsBowled: number;
};

export type ComputedInnings = {
  totals: ComputedInningsTotals;
  batting: Map<number, ComputedBattingRow>;
  bowling: Map<number, ComputedBowlingRow>;
};

export type InningsKey = 'innings1' | 'innings2' | 'superOverInnings1' | 'superOverInnings2';

function isLegalBall(ball: Ball) {
  return ball.extra !== 'wide' && ball.extra !== 'noball';
}

function ballsToOversText(legalBalls: number) {
  return formatBowlerOversFromLegalBalls(legalBalls);
}

function ensureBatting(m: Map<number, ComputedBattingRow>, id: number): ComputedBattingRow {
  let v = m.get(id);
  if (!v) {
    v = { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
    m.set(id, v);
  }
  return v;
}

function ensureBowling(m: Map<number, ComputedBowlingRow>, id: number): ComputedBowlingRow {
  let v = m.get(id);
  if (!v) {
    v = { overs: '0.0', conceded: 0, wickets: 0, wides: 0, noBalls: 0, legalBallsBowled: 0 };
    m.set(id, v);
  }
  return v;
}

export function recomputeInningsFromBalls(match: MatchSetup, inningsKey: InningsKey): ComputedInnings | null {
  const innings = (match as any)?.[inningsKey] as Innings | null | undefined;
  if (!innings) return null;

  const balls = (innings.balls ?? []) as Ball[];
  const totalRuns = balls.reduce((sum, b) => sum + (b?.runs ?? 0), 0);
  const totalWickets = balls.reduce((sum, b) => sum + (b?.wicket ? 1 : 0), 0);
  const totalLegalBalls = balls.reduce((sum, b) => sum + (isLegalBall(b) ? 1 : 0), 0);

  // Batting aggregates (mirrors recordBall logic)
  const batAgg = aggregateBattingFromBalls(balls);
  const batting = new Map<number, ComputedBattingRow>();
  for (const [pid, a] of batAgg.entries()) {
    batting.set(pid, { ...a, isOut: false });
  }

  // Mark outs from dismissed ids (keeps Scope A safe)
  for (const b of balls) {
    if (b?.wicket && b?.dismissedBatsmanId != null) {
      ensureBatting(batting, b.dismissedBatsmanId).isOut = true;
    }
  }

  // Bowling aggregates (mirrors recordBall crediting; byes/legbyes are still conceded in current app)
  const bowlAgg = aggregateBowlingFromBalls(balls);
  const bowling = new Map<number, ComputedBowlingRow>();
  for (const [pid, a] of bowlAgg.entries()) {
    bowling.set(pid, {
      overs: ballsToOversText(a.legalBallsBowled),
      conceded: a.conceded,
      wickets: a.wickets,
      wides: 0,
      noBalls: 0,
      legalBallsBowled: a.legalBallsBowled,
    });
  }

  // Add wides/no-balls counts from ball.extraRuns
  for (const b of balls) {
    const bid = b?.bowlerId;
    if (bid == null) continue;
    const row = ensureBowling(bowling, bid);
    if (b.extra === 'wide') row.wides += b.extraRuns ?? 0;
    if (b.extra === 'noball') row.noBalls += b.extraRuns ?? 0;
    // keep derived overs in sync
    row.overs = ballsToOversText(row.legalBallsBowled);
  }

  return {
    totals: {
      totalRuns,
      totalWickets,
      totalLegalBalls,
      oversText: ballsToOversText(totalLegalBalls),
    },
    batting,
    bowling,
  };
}

export function getComputedBatsman(
  computed: ComputedInnings | null | undefined,
  player: Player,
): ComputedBattingRow | null {
  if (!computed) return null;
  return computed.batting.get(Number(player.id)) ?? null;
}

export function getComputedBowler(
  computed: ComputedInnings | null | undefined,
  player: Player,
): ComputedBowlingRow | null {
  if (!computed) return null;
  return computed.bowling.get(Number(player.id)) ?? null;
}

