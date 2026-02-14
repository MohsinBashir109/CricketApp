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
export interface MatchSetup {
  teamA: Team;
  teamB: Team;
}
