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
  ballNumber: number;
  over: number;
  ballInOver: number; // 1–6 (only for legal balls)
  runs: number; // TOTAL runs added to team score for this delivery

  // extend
  extra?: 'wide' | 'noball' | 'bye' | 'legbye' | null;
  extraRuns?: number; // e.g. wide=1, noBall=1, bye=2, etc.
  runsOffBat?: number; // 0/1/2/3/4/6 (only for normal / noBall+bat)

  wicket?: boolean;

  strikerId: number | null;
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
  isCompleted?: boolean;
  resultReason?: 'CHASED' | 'DEFENDED' | 'TIE' | 'NO_RESULT';
  winnerTeam?: 'teamA' | 'teamB' | null;
  winnerTeamName?: string;
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
  activeModal?: ActiveModal; // which modal UI should show
  outTarget?: OutTarget | null; // who got out and must be replaced
  pendingBowlerChange?: boolean; // wicket happened on last ball of over
  isCompleted?: boolean;
  winnerReason?: 'ALL_OUT' | 'OVERS_DONE' | 'NO_PLAYERS';
  balls: Ball[];
}

export interface SetOpenersAndBowlerPayload {
  strikerId: number;
  nonStrikerId: number;
  bowlerId: number;
  innings?: 1 | 2; // optional; fallback to currentMatch.currentInnings
}

export type ActiveModal = 'OPENERS' | 'NEXT_BATSMAN' | 'NEXT_BOWLER' | null;
export type OutTarget = 'STRIKER' | 'NON_STRIKER';
