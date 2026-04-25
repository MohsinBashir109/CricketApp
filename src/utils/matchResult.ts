import type { Innings, MatchSetup } from '../types/Playertype';
import { ballsToOvers } from './constants';

export type MatchResultType =
  | 'WIN_BY_RUNS'
  | 'WIN_BY_WICKETS'
  | 'TIE'
  | 'NO_RESULT'
  | 'ABANDONED'
  | 'MANUAL';

export type MatchResultSummary = {
  teamAName: string;
  teamAScore: string;
  teamBName: string;
  teamBScore: string;
  oversInfo?: string;
};

export type MatchResult = {
  isMatchComplete: boolean;
  type: MatchResultType;
  winnerTeamId?: string;
  winnerTeamName?: string;
  title: string;
  message: string;
  resultText: string;
  summary: MatchResultSummary;
};

export type ManualResult =
  | { kind: 'MANUAL_WINNER'; winner: 'teamA' | 'teamB'; label?: string }
  | { kind: 'NO_RESULT'; label?: string }
  | { kind: 'ABANDONED'; label?: string }
  | { kind: 'TIE'; label?: string };

export type GetMatchResultArgs = {
  match?: MatchSetup | null;
  innings1?: Innings | null;
  innings2?: Innings | null;
  teamAName?: string;
  teamBName?: string;
  teamAId?: string | number | null;
  teamBId?: string | number | null;
  totalPlayers?: number | null;
  maxOvers?: number | null;
  matchStatus?: 'LIVE' | 'COMPLETED' | 'ABANDONED' | 'NO_RESULT' | 'TIE';
  manualResult?: ManualResult | null;
};

const fmtOvers = (balls?: number | null) => {
  const b = Number(balls ?? 0);
  if (!Number.isFinite(b) || b <= 0) return '0.0';
  return String(ballsToOvers(b));
};

const fmtScore = (innings?: Innings | null) => {
  if (!innings) return '0/0';
  const r = Number(innings.totalRuns ?? 0);
  const w = Number(innings.totalWickets ?? 0);
  return `${r}/${w}`;
};

const fmtScoreWithOvers = (innings?: Innings | null) => {
  if (!innings) return '0/0 (0.0 ov)';
  return `${fmtScore(innings)} (${fmtOvers(innings.totalBalls)} ov)`;
};

const winnerTeamIdFromMatch = (match: MatchSetup, w: 'teamA' | 'teamB') => {
  const team = w === 'teamA' ? match.teamA : match.teamB;
  const id = team?.id;
  return id == null ? undefined : String(id);
};

const maxWicketsForTeam = (match: MatchSetup, teamKey: 'teamA' | 'teamB') => {
  const team = teamKey === 'teamA' ? match.teamA : match.teamB;
  const count = team?.players?.length ?? 0;
  return Math.max(count - 1, 0);
};

export function getMatchResult(args: GetMatchResultArgs): MatchResult {
  const match = args.match ?? null;
  const i1 = args.innings1 ?? match?.innings1 ?? null;
  const i2 = args.innings2 ?? match?.innings2 ?? null;

  const teamAName = args.teamAName ?? match?.teamA?.name ?? 'Team A';
  const teamBName = args.teamBName ?? match?.teamB?.name ?? 'Team B';

  const summary: MatchResultSummary = {
    teamAName,
    teamAScore: match?.innings1 || match?.innings2 ? '' : '0/0',
    teamBName,
    teamBScore: match?.innings1 || match?.innings2 ? '' : '0/0',
  };

  if (match?.innings1 || match?.innings2) {
    const teamAInnings = i1?.battingTeam === 'teamA' ? i1 : i2?.battingTeam === 'teamA' ? i2 : null;
    const teamBInnings = i1?.battingTeam === 'teamB' ? i1 : i2?.battingTeam === 'teamB' ? i2 : null;
    summary.teamAScore = fmtScoreWithOvers(teamAInnings);
    summary.teamBScore = fmtScoreWithOvers(teamBInnings);
  }

  const defaultBase: MatchResult = {
    isMatchComplete: false,
    type: 'MANUAL',
    title: 'Match Complete',
    message: 'You can now view the full scorecard or finish the match.',
    resultText: '',
    summary,
  };

  // Manual / admin results (future-proof + also maps to existing MatchSettings in slice).
  if (args.manualResult) {
    const mr = args.manualResult;
    if (mr.kind === 'NO_RESULT') {
      return {
        ...defaultBase,
        isMatchComplete: true,
        type: 'NO_RESULT',
        resultText: mr.label ?? 'No Result',
        message: 'Match ended with no result.',
      };
    }
    if (mr.kind === 'ABANDONED') {
      return {
        ...defaultBase,
        isMatchComplete: true,
        type: 'ABANDONED',
        resultText: mr.label ?? 'Match Abandoned',
        message: 'Match was abandoned.',
      };
    }
    if (mr.kind === 'TIE') {
      return {
        ...defaultBase,
        isMatchComplete: true,
        type: 'TIE',
        resultText: mr.label ?? 'Match Tied',
        message: 'Scores are level.',
      };
    }
    if (mr.kind === 'MANUAL_WINNER') {
      const name = mr.winner === 'teamA' ? teamAName : teamBName;
      const teamId =
        match != null ? winnerTeamIdFromMatch(match, mr.winner) : undefined;
      return {
        ...defaultBase,
        isMatchComplete: true,
        type: 'MANUAL',
        winnerTeamId: teamId,
        winnerTeamName: name,
        resultText: mr.label ?? `${name} won`,
        message: 'Result was set manually.',
      };
    }
  }

  // If we have a match snapshot, prefer its canonical completion flags/reasons.
  if (match?.isCompleted) {
    if (match.resultReason === 'NO_RESULT') {
      return {
        ...defaultBase,
        isMatchComplete: true,
        type: 'NO_RESULT',
        resultText: 'No Result',
        message: 'Match ended with no result.',
      };
    }
    if (match.resultReason === 'TIE' || match.winnerTeam == null) {
      return {
        ...defaultBase,
        isMatchComplete: true,
        type: 'TIE',
        resultText: match.tieResolvedBy === 'super_over_tied' ? 'Match Tied (Super Over tied)' : 'Match Tied',
        message: 'Scores are level.',
      };
    }
  }

  // Fallback: derive from innings (covers “unexpected” ends where UI still has innings totals).
  if (!i1?.isCompleted) return defaultBase;
  if (!i2?.isCompleted) return defaultBase;

  const teamARuns = (i1.battingTeam === 'teamA' ? i1.totalRuns : 0) + (i2.battingTeam === 'teamA' ? i2.totalRuns : 0);
  const teamBRuns = (i1.battingTeam === 'teamB' ? i1.totalRuns : 0) + (i2.battingTeam === 'teamB' ? i2.totalRuns : 0);

  if (teamARuns === teamBRuns) {
    return {
      ...defaultBase,
      isMatchComplete: true,
      type: 'TIE',
      resultText: 'Match Tied',
      message: 'Scores are level.',
    };
  }

  // Determine winner.
  const winner: 'teamA' | 'teamB' = teamARuns > teamBRuns ? 'teamA' : 'teamB';
  const winnerName = winner === 'teamA' ? teamAName : teamBName;
  const winnerId =
    match != null ? winnerTeamIdFromMatch(match, winner) : undefined;

  // Determine if winner won by wickets (chased) or by runs (defended).
  const chasingTeam = i2.battingTeam;
  if (winner === chasingTeam) {
    const maxWk = match ? maxWicketsForTeam(match, chasingTeam) : Math.max((args.totalPlayers ?? 11) - 1, 0);
    const remaining = Math.max(maxWk - (i2.totalWickets ?? 0), 0);
    return {
      ...defaultBase,
      isMatchComplete: true,
      type: 'WIN_BY_WICKETS',
      winnerTeamId: winnerId,
      winnerTeamName: winnerName,
      resultText: `${winnerName} won by ${remaining} wicket${remaining === 1 ? '' : 's'}`,
      message: 'Target chased successfully.',
    };
  }

  const runMargin = Math.max(teamARuns - teamBRuns, teamBRuns - teamARuns);
  return {
    ...defaultBase,
    isMatchComplete: true,
    type: 'WIN_BY_RUNS',
    winnerTeamId: winnerId,
    winnerTeamName: winnerName,
    resultText: `${winnerName} won by ${runMargin} run${runMargin === 1 ? '' : 's'}`,
    message: 'Overs completed. Target not chased.',
  };
}

export function getMatchResultFromMatch(match: MatchSetup): MatchResult {
  return getMatchResult({ match });
}

