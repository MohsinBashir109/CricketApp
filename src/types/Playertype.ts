export type PlayerRole = 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';

export interface Player {
  id: number;
  name: string;
  role?: PlayerRole;
  // Batting
  runs: number | null;
  balls: number | null;
  fours: number | null;
  sixes: number | null;
  isOut: boolean | null;
  outType?:
    | 'bowled'
    | 'caught'
    | 'lbw'
    | 'runout'
    | 'stumped'
    | 'hitwicket'
    | 'retired'
    | '';
  outByBowlerId?: string | null;
  outByFielderId?: string | null;

  // Bowling (optional for later)
  overs: number | null; // you can store ballsBowled instead (recommended)
  maidens: number | null;
  conceded: number | null;
  wickets: number | null;

  // Extras (if you ever attribute)
  wides: number | null;
  noBalls: number | null;
}
export interface Team {
  id: number | null;
  name: string;
  players: Player[];
}

export interface Ball {
  ballNumber: number; // global ball number
  over: number;
  ballInOver: number; // 1–6
  runs: number;
  extra?: 'wide' | 'noball' | null;
  wicket?: boolean;
  strikerId: number | null; // optional but useful
  bowlerId: number | null;
}

export interface MatchSetup {
  teamA: Team | null;
  teamB: Team | null;
  tossWinner?: 'teamA' | 'teamB' | '';
  electedTo?: 'bat' | 'bowl' | '';
  overs?: number | null;
  tossWinnerName?: string;
  currentInnings: 1 | 2 | null;

  innings1: Innings | null;
  innings2: Innings | null;
}

export interface Innings {
  battingTeam: 'teamA' | 'teamB';
  bowlingTeam: 'teamA' | 'teamB';
  bowlingTeamName: string;
  battingTeamName: string;
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  strikerId: number | null;
  nonStrikerId: number | null;
  bowlerId: number | null;

  balls: Ball[];
}

export interface SetOpenersAndBowlerPayload {
  strikerId: number;
  nonStrikerId: number;
  bowlerId: number;
  innings?: 1 | 2; // optional; fallback to currentMatch.currentInnings
}
