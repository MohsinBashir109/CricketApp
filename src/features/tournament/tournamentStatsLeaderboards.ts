import type { MatchSetup, Player, Team } from '../../types/Playertype';
import { oversToBalls, widthPixel } from '../../utils/constants';

export type StatsLeaderboardRow = {
  rank: number;
  playerName: string;
  teamName: string;
  cells: string[];
};

export type StatsLeaderboardSection = {
  id: string;
  title: string;
  columns: { label: string; width: number }[];
  boldColumnIndex: number | null;
  rows: StatsLeaderboardRow[];
};

type BatContrib = { matchId: string; runs: number; balls: number; dismissed: boolean };
type BowlContrib = { matchId: string; w: number; conc: number; oversBalls: number };

type BatAgg = { key: string; name: string; teamName: string; c: BatContrib[] };
type BowlAgg = { key: string; name: string; teamName: string; c: BowlContrib[] };

function playerKey(team: Team, p: Player) {
  return `${team.id ?? 'x'}_${p.id}`;
}

function fmt2(n: number) {
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

function collectAggs(matches: MatchSetup[]) {
  const bat = new Map<string, BatAgg>();
  const bowl = new Map<string, BowlAgg>();

  const touchBat = (team: Team, p: Player, row: BatContrib) => {
    const k = playerKey(team, p);
    let a = bat.get(k);
    if (!a) {
      a = { key: k, name: p.name, teamName: team.name, c: [] };
      bat.set(k, a);
    }
    a.teamName = team.name;
    a.c.push(row);
  };

  const touchBowl = (team: Team, p: Player, row: BowlContrib) => {
    const k = playerKey(team, p);
    let a = bowl.get(k);
    if (!a) {
      a = { key: k, name: p.name, teamName: team.name, c: [] };
      bowl.set(k, a);
    }
    a.teamName = team.name;
    a.c.push(row);
  };

  for (const m of matches) {
    if (!m.teamA?.players || !m.teamB?.players) continue;
    for (const team of [m.teamA, m.teamB]) {
      if (!team?.players) continue;
      for (const p of team.players) {
        const runs = p.runs ?? 0;
        const balls = p.balls ?? 0;
        if (balls > 0 || runs > 0 || p.isOut === true) {
          touchBat(team, p, {
            matchId: m.matchId,
            runs,
            balls,
            dismissed: p.isOut === true,
          });
        }
        const w = p.wickets ?? 0;
        const conc = p.conceded ?? 0;
        const ob = oversToBalls(p.overs);
        if (w > 0 || ob > 0 || conc > 0) {
          touchBowl(team, p, {
            matchId: m.matchId,
            w,
            conc,
            oversBalls: ob,
          });
        }
      }
    }
  }

  return { bat, bowl };
}

function rankRows<T>(
  items: T[],
  sortKey: (t: T) => number,
  higherBetter: boolean,
): (T & { rank: number })[] {
  const sorted = [...items].sort((a, b) =>
    higherBetter ? sortKey(b) - sortKey(a) : sortKey(a) - sortKey(b),
  );
  let rank = 1;
  const out: (T & { rank: number })[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sortKey(sorted[i]) !== sortKey(sorted[i - 1])) rank = i + 1;
    out.push({ ...sorted[i], rank });
  }
  return out;
}

export function computeTournamentStatsSections(matches: MatchSetup[]): StatsLeaderboardSection[] {
  if (!matches.length) return [];

  const { bat, bowl } = collectAggs(matches);

  const batList = [...bat.values()].filter(a => a.c.length > 0);
  const bowlList = [...bowl.values()].filter(a => a.c.length > 0);

  const runsRows = rankRows(batList, a => sum(a.c, x => x.runs), true).slice(0, 15);
  const wicketsRows = rankRows(bowlList, a => sum(a.c, x => x.w), true).slice(0, 15);

  const hsCandidates = batList
    .map(a => {
      let best = a.c[0];
      for (const x of a.c) {
        if (x.runs > best.runs) best = x;
      }
      const sr = best.balls > 0 ? (best.runs / best.balls) * 100 : 0;
      return { a, bestRuns: best.runs, bestBalls: best.balls, sr, notOut: !best.dismissed };
    })
    .filter(x => x.bestRuns > 0);
  const hsRows = rankRows(hsCandidates, x => x.bestRuns, true).slice(0, 15);

  const bbCandidates = bowlList
    .map(a => {
      let best = a.c[0];
      for (const x of a.c) {
        if (x.w > best.w || (x.w === best.w && x.conc < best.conc)) best = x;
      }
      const oversStr = best.oversBalls > 0 ? (best.oversBalls / 6).toFixed(1) : '0';
      const econ = best.oversBalls > 0 ? best.conc / (best.oversBalls / 6) : 0;
      return { a, best, oversStr, econ };
    })
    .filter(x => x.best.w > 0 || x.best.conc > 0);
  const bbRows = rankRows(
    bbCandidates,
    x => x.best.w * 1000 - x.best.conc,
    true,
  ).slice(0, 15);

  const batAvgRows = rankRows(
    batList
      .map(a => {
        const runs = sum(a.c, x => x.runs);
        const outs = a.c.filter(x => x.dismissed).length;
        const avg = outs > 0 ? runs / outs : runs;
        return { a, runs, outs, avg, m: a.c.length };
      })
      .filter(x => x.m > 0 && x.runs > 0),
    x => x.avg,
    true,
  ).slice(0, 15);

  const bowlAvgRows = rankRows(
    bowlList
      .map(a => {
        const w = sum(a.c, x => x.w);
        const conc = sum(a.c, x => x.conc);
        const avg = w > 0 ? conc / w : conc;
        return { a, w, conc, avg, m: a.c.length };
      })
      .filter(x => x.w > 0),
    x => x.avg,
    false,
  ).slice(0, 15);

  const hundredsRows = rankRows(
    batList
      .map(a => ({
        a,
        n: a.c.filter(x => x.runs >= 100).length,
        runs: sum(a.c, x => x.runs),
        m: a.c.length,
      }))
      .filter(x => x.n > 0),
    x => x.n,
    true,
  ).slice(0, 15);

  const fiftiesRows = rankRows(
    batList
      .map(a => ({
        a,
        n: a.c.filter(x => x.runs >= 50 && x.runs < 100).length,
        runs: sum(a.c, x => x.runs),
        m: a.c.length,
      }))
      .filter(x => x.n > 0),
    x => x.n,
    true,
  ).slice(0, 15);

  const econRows = rankRows(
    bowlList
      .map(a => {
        const conc = sum(a.c, x => x.conc);
        const ob = sum(a.c, x => x.oversBalls);
        const econ = ob > 0 ? conc / (ob / 6) : 999;
        return { a, w: sum(a.c, x => x.w), econ, m: a.c.length, conc, ob };
      })
      .filter(x => x.ob > 0 && x.m > 0),
    x => -x.econ,
    true,
  ).slice(0, 15);

  const sections: StatsLeaderboardSection[] = [];

  sections.push({
    id: 'runs',
    title: 'Runs',
    columns: [
      { label: 'M', width: widthPixel(34) },
      { label: 'Avg', width: widthPixel(52) },
      { label: 'Runs', width: widthPixel(48) },
    ],
    boldColumnIndex: 2,
    rows: runsRows.map(r => {
      const runs = sum(r.c, x => x.runs);
      const outs = r.c.filter(x => x.dismissed).length;
      const avg = outs > 0 ? runs / outs : runs;
      return {
        rank: r.rank,
        playerName: r.name,
        teamName: r.teamName,
        cells: [String(r.c.length), fmt2(avg), String(runs)],
      };
    }),
  });

  sections.push({
    id: 'wickets',
    title: 'Wickets',
    columns: [
      { label: 'M', width: widthPixel(34) },
      { label: 'Econ', width: widthPixel(52) },
      { label: 'W', width: widthPixel(40) },
    ],
    boldColumnIndex: 2,
    rows: wicketsRows.map(r => {
      const w = sum(r.c, x => x.w);
      const conc = sum(r.c, x => x.conc);
      const ob = sum(r.c, x => x.oversBalls);
      const econ = ob > 0 ? conc / (ob / 6) : 0;
      return {
        rank: r.rank,
        playerName: r.name,
        teamName: r.teamName,
        cells: [String(r.c.length), fmt2(econ), String(w)],
      };
    }),
  });

  sections.push({
    id: 'hs',
    title: 'Highest Scores',
    columns: [
      { label: 'SR', width: widthPixel(56) },
      { label: 'HS', width: widthPixel(48) },
    ],
    boldColumnIndex: 1,
    rows: hsRows.map(r => {
      const sr = r.bestBalls > 0 ? (r.bestRuns / r.bestBalls) * 100 : 0;
      const hs = `${r.bestRuns}${r.notOut ? '*' : ''}`;
      return {
        rank: r.rank,
        playerName: r.a.name,
        teamName: r.a.teamName,
        cells: [fmt2(sr), hs],
      };
    }),
  });

  sections.push({
    id: 'bb',
    title: 'Best Bowling Figures',
    columns: [
      { label: 'O', width: widthPixel(36) },
      { label: 'Econ', width: widthPixel(48) },
      { label: 'BB', width: widthPixel(52) },
    ],
    boldColumnIndex: 2,
    rows: bbRows.map(r => ({
      rank: r.rank,
      playerName: r.a.name,
      teamName: r.a.teamName,
      cells: [r.oversStr, fmt2(r.econ), `${r.best.w}/${r.best.conc}`],
    })),
  });

  sections.push({
    id: 'batavg',
    title: 'Batting Average',
    columns: [
      { label: 'M', width: widthPixel(34) },
      { label: 'Runs', width: widthPixel(48) },
      { label: 'Avg', width: widthPixel(52) },
    ],
    boldColumnIndex: 2,
    rows: batAvgRows.map(r => ({
      rank: r.rank,
      playerName: r.a.name,
      teamName: r.a.teamName,
      cells: [String(r.m), String(r.runs), fmt2(r.avg)],
    })),
  });

  sections.push({
    id: 'bowlavg',
    title: 'Bowling Average',
    columns: [
      { label: 'M', width: widthPixel(34) },
      { label: 'W', width: widthPixel(36) },
      { label: 'Avg', width: widthPixel(52) },
    ],
    boldColumnIndex: 2,
    rows: bowlAvgRows.map(r => ({
      rank: r.rank,
      playerName: r.a.name,
      teamName: r.a.teamName,
      cells: [String(r.m), String(r.w), fmt2(r.avg)],
    })),
  });

  sections.push({
    id: 'econ',
    title: 'Economy',
    columns: [
      { label: 'M', width: widthPixel(34) },
      { label: 'W', width: widthPixel(36) },
      { label: 'Econ', width: widthPixel(52) },
    ],
    boldColumnIndex: 2,
    rows: econRows.map(r => ({
      rank: r.rank,
      playerName: r.a.name,
      teamName: r.a.teamName,
      cells: [String(r.m), String(r.w), fmt2(r.econ)],
    })),
  });

  sections.push({
    id: '100s',
    title: 'Most Hundreds',
    columns: [
      { label: 'M', width: widthPixel(34) },
      { label: 'Runs', width: widthPixel(48) },
      { label: '100s', width: widthPixel(44) },
    ],
    boldColumnIndex: 2,
    rows: hundredsRows.map(r => ({
      rank: r.rank,
      playerName: r.a.name,
      teamName: r.a.teamName,
      cells: [String(r.m), String(r.runs), String(r.n)],
    })),
  });

  sections.push({
    id: '50s',
    title: 'Most Fifties',
    columns: [
      { label: 'M', width: widthPixel(34) },
      { label: 'Runs', width: widthPixel(48) },
      { label: '50s', width: widthPixel(44) },
    ],
    boldColumnIndex: 2,
    rows: fiftiesRows.map(r => ({
      rank: r.rank,
      playerName: r.a.name,
      teamName: r.a.teamName,
      cells: [String(r.m), String(r.runs), String(r.n)],
    })),
  });

  return sections.filter(s => s.rows.length > 0);
}

function sum<T>(arr: T[], fn: (t: T) => number) {
  return arr.reduce((a, x) => a + fn(x), 0);
}
