import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PlayerRole } from '../../types/Playertype';
import { TeamEntity, TeamPlayer, TeamPlayerAddTiming } from '../../types/TournamentTypes';

type AddTeamPlayerInput = {
  name: string;
  role: PlayerRole;
};

type AddTeamPayload = {
  id?: string;
  name: string;
  shortName?: string;
  players: AddTeamPlayerInput[];
  playerAddTiming?: TeamPlayerAddTiming;
};

type UpdateTeamPayload = {
  id: string;
  name: string;
  shortName?: string;
  players: AddTeamPlayerInput[];
  playerAddTiming?: TeamPlayerAddTiming;
};

interface TeamsState {
  byId: Record<string, TeamEntity>;
  allIds: string[];
}

const initialState: TeamsState = {
  byId: {},
  allIds: [],
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

const buildPlayers = (players: AddTeamPlayerInput[]): TeamPlayer[] =>
  players.map(player => ({
    id: createId('player'),
    name: normalizeName(player.name),
    role: player.role,
  }));

const isDuplicateTeamName = (
  state: TeamsState,
  candidateName: string,
  ignoredId?: string,
) => {
  const normalizedCandidate = normalizeName(candidateName).toLowerCase();
  return state.allIds.some(teamId => {
    if (ignoredId && teamId === ignoredId) return false;
    return (
      normalizeName(state.byId[teamId]?.name ?? '').toLowerCase() ===
      normalizedCandidate
    );
  });
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    addTeam(state, action: PayloadAction<AddTeamPayload>) {
      const name = normalizeName(action.payload.name);
      const playerAddTiming: TeamPlayerAddTiming = action.payload.playerAddTiming ?? 'now';
      if (!name) return;
      if (playerAddTiming === 'now' && action.payload.players.length === 0) return;
      if (isDuplicateTeamName(state, name)) return;

      const id = action.payload.id ?? createId('team');
      const now = new Date().toISOString();
      state.byId[id] = {
        id,
        name,
        shortName: normalizeName(action.payload.shortName ?? '') || undefined,
        players: buildPlayers(action.payload.players),
        playerAddTiming,
        createdAt: now,
        updatedAt: now,
        isArchived: false,
      };
      state.allIds.unshift(id);
    },
    updateTeam(state, action: PayloadAction<UpdateTeamPayload>) {
      const existing = state.byId[action.payload.id];
      if (!existing) return;

      const name = normalizeName(action.payload.name);
      const playerAddTiming: TeamPlayerAddTiming =
        action.payload.playerAddTiming ?? existing.playerAddTiming ?? 'now';
      if (!name) return;
      if (playerAddTiming === 'now' && action.payload.players.length === 0) return;
      if (isDuplicateTeamName(state, name, action.payload.id)) return;

      state.byId[action.payload.id] = {
        ...existing,
        name,
        shortName: normalizeName(action.payload.shortName ?? '') || undefined,
        players: buildPlayers(action.payload.players),
        playerAddTiming,
        updatedAt: new Date().toISOString(),
      };
    },
    archiveTeam(state, action: PayloadAction<string>) {
      const team = state.byId[action.payload];
      if (!team) return;
      team.isArchived = true;
      team.updatedAt = new Date().toISOString();
    },
    restoreTeam(state, action: PayloadAction<string>) {
      const team = state.byId[action.payload];
      if (!team) return;
      team.isArchived = false;
      team.updatedAt = new Date().toISOString();
    },
  },
});

export const { addTeam, updateTeam, archiveTeam, restoreTeam } =
  teamsSlice.actions;

export default teamsSlice.reducer;
