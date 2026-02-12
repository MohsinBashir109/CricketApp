export type PlayerRole = 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';

export interface Player {
  id: string;
  name: string;
  role?: PlayerRole;
  // Batting
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  outType?:
    | 'bowled'
    | 'caught'
    | 'lbw'
    | 'runout'
    | 'stumped'
    | 'hitwicket'
    | 'retired';
  outByBowlerId?: string;
  outByFielderId?: string;

  // Bowling (optional for later)
  overs: number; // you can store ballsBowled instead (recommended)
  maidens: number;
  conceded: number;
  wickets: number;

  // Extras (if you ever attribute)
  wides: number;
  noBalls: number;
}
export interface Team {
  id: number | null;
  name: string;
  players: Player[];
}
export interface MatchSetup {
  teamA: Team;
  teamB: Team;
}
