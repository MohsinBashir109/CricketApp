import { PlayerRole } from './Playertype';

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type TournamentFormatType = 'open' | 'groupBased';
export type TournamentCompetitionType = 'league' | 'cup' | 'custom';
export type TournamentEntryStatus = 'active' | 'withdrawn' | 'disqualified';
export type TournamentMatchStatus =
  | 'upcoming'
  | 'live'
  | 'completed'
  | 'abandoned'
  | 'no_result'
  | 'cancelled';

export interface TeamPlayer {
  id: string;
  name: string;
  role: PlayerRole;
}

export interface TeamEntity {
  id: string;
  name: string;
  shortName?: string;
  players: TeamPlayer[];
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

export interface TournamentFixtureEntity {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  overs: number | null;
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
