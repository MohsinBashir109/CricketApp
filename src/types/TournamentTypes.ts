import { PlayerRole } from './Playertype';

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type TournamentFormatType = 'open' | 'groupBased';
export type TournamentCompetitionType = 'league' | 'cup' | 'custom';
export type TournamentEntryStatus = 'active' | 'withdrawn' | 'disqualified';

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
  pointsSystem?: {
    win: number;
    tie: number;
    loss: number;
    noResult: number;
  };
  knockoutEnabled?: boolean;
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
