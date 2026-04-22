import type { Ball } from '../types/Playertype';

export type InningsBatAgg = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
};

export type InningsBowlAgg = {
  conceded: number;
  wickets: number;
  legalBallsBowled: number;
};

/** Mirrors recordBall so score rows match what was credited for this innings only. */
export function aggregateBattingFromBalls(
  balls: Ball[] | undefined | null,
): Map<number, InningsBatAgg> {
  const m = new Map<number, InningsBatAgg>();
  const ensure = (id: number): InningsBatAgg => {
    let a = m.get(id);
    if (!a) {
      a = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      m.set(id, a);
    }
    return a;
  };

  for (const ball of balls ?? []) {
    const sid = ball.strikerId;
    if (sid == null) continue;

    const isWide = ball.extra === 'wide';
    const isNoBall = ball.extra === 'noball';
    const isBye = ball.extra === 'bye';
    const isLegBye = ball.extra === 'legbye';
    const isLegal = !isWide && !isNoBall;
    const runsOffBat = ball.runsOffBat ?? 0;

    const agg = ensure(sid);
    if (isLegal) agg.balls += 1;
    if (!isBye && !isLegBye) {
      agg.runs += runsOffBat;
      if (runsOffBat === 4) agg.fours += 1;
      if (runsOffBat === 6) agg.sixes += 1;
    }
  }
  return m;
}

export function aggregateBowlingFromBalls(
  balls: Ball[] | undefined | null,
): Map<number, InningsBowlAgg> {
  const m = new Map<number, InningsBowlAgg>();
  const ensure = (id: number): InningsBowlAgg => {
    let a = m.get(id);
    if (!a) {
      a = { conceded: 0, wickets: 0, legalBallsBowled: 0 };
      m.set(id, a);
    }
    return a;
  };

  for (const ball of balls ?? []) {
    const bid = ball.bowlerId;
    if (bid == null) continue;

    const isWide = ball.extra === 'wide';
    const isNoBall = ball.extra === 'noball';
    const isLegal = !isWide && !isNoBall;
    const agg = ensure(bid);
    agg.conceded += ball.runs ?? 0;
    if (ball.wicket) agg.wickets += 1;
    if (isLegal) agg.legalBallsBowled += 1;
  }
  return m;
}

export function formatBowlerOversFromLegalBalls(legalBalls: number): string {
  const o = Math.floor(legalBalls / 6);
  const b = legalBalls % 6;
  return `${o}.${b}`;
}
