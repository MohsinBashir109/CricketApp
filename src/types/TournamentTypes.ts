import { PlayerRole } from './Playertype';

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type TournamentFormatType = 'open' | 'groupBased';
/** Schedule model: open pool vs multiple groups (maps to formatType). */
export type TournamentScheduleFormat = 'OPEN_GROUP' | 'MULTIPLE_GROUPS';

/** Synthetic opponent for round-robin bye weeks / walkovers. */
export const TOURNAMENT_BYE_TEAM_ID = '__TOURNAMENT_BYE__';

/** Temporary ids for knockout slots before qualifiers are known (must differ so fixtures stay valid). */
export const TBD_FIXTURE_SIDE_A = '__TBD_SIDE_A__';
export const TBD_FIXTURE_SIDE_B = '__TBD_SIDE_B__';

export const isTournamentPlaceholderTeamId = (id: string | null | undefined) =>
  !id ||
  id === TBD_FIXTURE_SIDE_A ||
  id === TBD_FIXTURE_SIDE_B;
export type TournamentCompetitionType = 'league' | 'cup' | 'custom';
export type TournamentEntryStatus = 'active' | 'withdrawn' | 'disqualified';
export type TournamentMatchStatus =
  | 'upcoming'
  | 'live'
  | 'completed'
  | 'abandoned'
  | 'no_result'
  | 'cancelled';

/** Result recorded from match settings without in-app ball-by-ball scoring. */
export type TournamentFixtureManualOutcome = 'teamA' | 'teamB' | 'tie';

export interface TeamPlayer {
  id: string;
  name: string;
  role: PlayerRole;
}

export type TeamPlayerAddTiming = 'now' | 'during_match';

export interface TeamEntity {
  id: string;
  name: string;
  shortName?: string;
  players: TeamPlayer[];
  /**
   * When "during_match", the team can be saved with an empty squad and players
   * are expected to be added later (e.g. at match time).
   */
  playerAddTiming?: TeamPlayerAddTiming;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface TournamentSettings {
  allowRegenerateGroupsBeforeStart: boolean;
  autoCreateGroups: boolean;
  /**
   * For league/group round-robin: 1 = play each opponent once, 2 = play twice.
   * Stored on the tournament so fixture generation can default correctly.
   */
  roundRobinLegs?: 1 | 2;
  pointsSystem?: {
    win: number;
    tie: number;
    loss: number;
    noResult: number;
  };
  knockoutEnabled?: boolean;
  /** For group-based tournaments: top N teams from each group qualify. */
  qualifiersPerGroup?: number;
  /** Mirrors formatType for UI copy: OPEN_GROUP = open, MULTIPLE_GROUPS = groupBased. */
  tournamentScheduleFormat?: TournamentScheduleFormat;
  /** Open pool: top N teams enter knockout (when knockoutEnabled). */
  openGroupQualifiers?: number;
  /** True after full schedule (group + knockout shell) has been generated once. */
  fixturesGenerated?: boolean;
}

export interface TournamentEntity {
  id: string;
  name: string;
  status: TournamentStatus;
  formatType: TournamentFormatType;
  competitionType: TournamentCompetitionType;
  teamCount: number;
  selectedTeamIds: string[];
  groupCount: number | null;
  groupIds: string[];
  seed: string | null;
  createdAt: string;
  updatedAt: string;
  winnerTeamId?: string | null;
  settings: TournamentSettings;
}

export type TournamentFixtureStage = 'GROUP' | 'KNOCKOUT';

export type KnockoutRoundCode = 'R32' | 'R16' | 'QF' | 'SF' | 'F' | 'TP';

export interface TournamentFixtureEntity {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  overs: number | null;
  /** Max players allowed per team for this fixture (used for add-during-match). */
  playersPerTeam?: number | null;
  status: TournamentMatchStatus;
  scheduledAt: string | null;
  venue: string | null;
  roundLabel: string | null; // e.g. "League", "Group A", "Semi Final"
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Set when scoring starts (MatchSetup.matchId). */
  matchId: string | null;
  /** Set when the result is published. */
  resultSummary: string | null;
  /** Defaults to GROUP for legacy fixtures without this field. */
  stage?: TournamentFixtureStage;
  roundNumber?: number;
  matchNumber?: number;
  knockoutRound?: KnockoutRoundCode | null;
  teamAPlaceholder?: string | null;
  teamBPlaceholder?: string | null;
  teamASeed?: string | null;
  teamBSeed?: string | null;
  /** Winner of this fixture is copied into the target fixture as team A or B. */
  advancesWinnerToFixtureId?: string | null;
  advancesWinnerAs?: 'teamA' | 'teamB' | null;
  /** Set when knockout / bye match is decided without ambiguity. */
  winnerTeamId?: string | null;
  /** Win / tie decided manually (no `matchId`). Used for points tables and display. */
  manualOutcome?: TournamentFixtureManualOutcome | null;
}

export interface TournamentGroup {
  id: string;
  tournamentId: string;
  name: string;
  order: number;
  teamIds: string[];
  createdAt: string;
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  teamId: string;
  entryOrder: number;
  groupId: string | null;
  status: TournamentEntryStatus;
  createdAt: string;
}

export interface TournamentDraftGroup {
  name: string;
  order: number;
  teamIds: string[];
}

/** Transient payload from `TournamentStructureScreen` → `CreateTournamentFlow` (Redux, then cleared). */
export type TournamentStructureDraftResult = {
  formatType: TournamentFormatType;
  groupCountInput: string;
  groupsPreview: TournamentDraftGroup[];
  groupSeed: string | null;
  generatedSignature: string | null;
};

/** Params for `TournamentReviewScreen` (stack navigation, serializable). */
export type TournamentWizardReviewParams = {
  tournamentName: string;
  teamCount: number;
  selectedTeamIds: string[];
  formatType: TournamentFormatType;
  /** Parsed group count; use `0` when format is open (maps to `null` in create payload). */
  groupCount: number;
  groupSeed: string | null;
  groupsPreview: TournamentDraftGroup[];
  generatedSignature: string | null;
};

export interface CreateTournamentPayload {
  id?: string;
  name: string;
  formatType: TournamentFormatType;
  competitionType: TournamentCompetitionType;
  teamCount: number;
  selectedTeamIds: string[];
  groupCount: number | null;
  seed: string | null;
  groups: TournamentDraftGroup[];
  settings?: Partial<TournamentSettings>;
}
