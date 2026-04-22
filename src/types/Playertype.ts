export type PlayerRole = 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';

export type PlayerStatus =
  | 'AVAILABLE'
  | 'BATTING'
  | 'OUT'
  | 'BOWLING'
  | 'FIELDING'
  | 'SUBSTITUTE'
  | 'USED';

export interface Player {
  id: number;
  name: string;
  role?: PlayerRole;
  /** Optional metadata for live player-management (UI + validations). */
  canBat?: boolean;
  canBowl?: boolean;
  canField?: boolean;
  isSubstitute?: boolean;
  lateAdded?: boolean;
  jerseyNumber?: number;
  /** Optional UI-only status; match engine still uses innings + `isOut`. */
  status?: PlayerStatus;
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
  /** Who was dismissed on this ball (when wicket is true); used for Super Over score rows. */
  dismissedBatsmanId?: number | null;

  strikerId: number | null;
  bowlerId: number | null;
}

/** Reasons recorded from Match Settings (interruption or admin result). */
export type MatchSettingsReasonChip =
  | 'RAIN'
  | 'BAD_LIGHT'
  | 'TEAM_LEFT'
  | 'TECHNICAL'
  | 'OTHER';

export interface MatchSetup {
  matchId: string;
  /** Optional linkage when match is scored inside a tournament fixture. */
  tournamentId?: string;
  fixtureId?: string;
  /** Fixture-level limit: max players allowed per team. */
  playersPerTeam?: number | null;
  /** Source saved team ids (for persisting late-added players back to teams). */
  sourceTeamAId?: string;
  sourceTeamBId?: string;
  teamA: Team | null;
  teamB: Team | null;
  tossWinner?: 'teamA' | 'teamB' | '';
  electedTo?: 'bat' | 'bowl' | '';
  overs?: number | null;
  tossWinnerName?: string;
  /** 3 / 4 = Super Over (first / second innings of the over-per-side tie-break). */
  currentInnings: 1 | 2 | 3 | 4 | null;

  innings1: Innings | null;
  innings2: Innings | null;
  /** Super Over innings after a tied main innings (optional). */
  superOverInnings1?: Innings | null;
  superOverInnings2?: Innings | null;
  /**
   * Completed Super Over pairs from earlier tie-break rounds (each: first bat, reply).
   * Appended when a Super Over is tied and another round is started.
   */
  superOverHistory?: SuperOverRoundSnapshot[] | null;
  /** Main innings scores level — user must pick draw or Super Over (scoring paused). */
  pendingTieResolution?: boolean;
  /** How a tie was settled (if applicable). */
  tieResolvedBy?: 'draw' | 'super_over' | 'super_over_tied';
  isCompleted?: boolean;
  resultReason?: 'CHASED' | 'DEFENDED' | 'TIE' | 'NO_RESULT';
  winnerTeam?: 'teamA' | 'teamB' | null;
  winnerTeamName?: string;
  /** When true, scoring actions are blocked (live match paused). */
  isScoringPaused?: boolean;
  /** Match Settings: last saved interruption / admin context (optional). */
  matchSettingsReason?: MatchSettingsReasonChip;
  matchSettingsNote?: string;
}

/** Immutable snapshot of one finished Super Over round (two mini-innings). */
export interface SuperOverRoundSnapshot {
  inning1: Innings;
  inning2: Innings;
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
  /** Set when openers are confirmed; used for consistent undo/replay. */
  openingStrikerId?: number | null;
  openingNonStrikerId?: number | null;
  openingBowlerId?: number | null;
  activeModal?: ActiveModal; // which modal UI should show
  outTarget?: OutTarget | null; // who got out and must be replaced
  pendingBowlerChange?: boolean; // wicket happened on last ball of over
  isCompleted?: boolean;
  winnerReason?: 'ALL_OUT' | 'OVERS_DONE' | 'NO_PLAYERS' | 'TARGET_CHASED';
  balls: Ball[];
}

export interface SetOpenersAndBowlerPayload {
  strikerId: number;
  nonStrikerId: number;
  bowlerId: number;
  innings?: 1 | 2 | 3 | 4; // optional; fallback to currentMatch.currentInnings
}

export type ActiveModal = 'OPENERS' | 'NEXT_BATSMAN' | 'NEXT_BOWLER' | null;
export type OutTarget = 'STRIKER' | 'NON_STRIKER';
