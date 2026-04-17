import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  CreateTournamentPayload,
  TournamentEntity,
  TournamentGroup,
  TournamentSettings,
  TournamentTeam,
} from '../../types/TournamentTypes';

interface TournamentState {
  tournamentsById: Record<string, TournamentEntity>;
  tournamentIds: string[];
  groupsById: Record<string, TournamentGroup>;
  tournamentTeamsById: Record<string, TournamentTeam>;
}

const initialState: TournamentState = {
  tournamentsById: {},
  tournamentIds: [],
  groupsById: {},
  tournamentTeamsById: {},
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultSettings: TournamentSettings = {
  allowRegenerateGroupsBeforeStart: true,
  autoCreateGroups: true,
  pointsSystem: {
    win: 2,
    tie: 1,
    loss: 0,
    noResult: 1,
  },
  knockoutEnabled: false,
};

const hasValidGrouping = (selectedTeamIds: string[], groupTeamIds: string[][]) => {
  const flattened = groupTeamIds.flat();
  if (flattened.length !== selectedTeamIds.length) return false;
  if (new Set(flattened).size !== flattened.length) return false;
  return selectedTeamIds.every(teamId => flattened.includes(teamId));
};

const tournamentSlice = createSlice({
  name: 'tournament',
  initialState,
  reducers: {
    createTournament(state, action: PayloadAction<CreateTournamentPayload>) {
      const payload = action.payload;
      const uniqueTeamIds = Array.from(new Set(payload.selectedTeamIds));
      const isGroupBased = payload.formatType === 'groupBased';

      if (!payload.name.trim()) return;
      if (payload.teamCount <= 1) return;
      if (uniqueTeamIds.length !== payload.teamCount) return;
      if (uniqueTeamIds.length !== payload.selectedTeamIds.length) return;
      if (!isGroupBased && (payload.groupCount !== null || payload.groups.length > 0)) return;
      if (
        isGroupBased &&
        (!payload.groupCount ||
          payload.groupCount < 1 ||
          payload.groupCount > payload.teamCount ||
          payload.groups.length !== payload.groupCount ||
          !hasValidGrouping(
            uniqueTeamIds,
            payload.groups.map(group => group.teamIds),
          ))
      ) {
        return;
      }

      const now = new Date().toISOString();
      const tournamentId = payload.id ?? createId('tournament');

      const groupIds = payload.groups.map(group => {
        const groupId = createId('group');
        state.groupsById[groupId] = {
          id: groupId,
          tournamentId,
          name: group.name,
          order: group.order,
          teamIds: group.teamIds,
          createdAt: now,
        };
        return groupId;
      });

      uniqueTeamIds.forEach((teamId, index) => {
        const groupId =
          groupIds.find(id => state.groupsById[id]?.teamIds.includes(teamId)) ?? null;

        const tournamentTeamId = createId('tournament-team');
        state.tournamentTeamsById[tournamentTeamId] = {
          id: tournamentTeamId,
          tournamentId,
          teamId,
          entryOrder: index + 1,
          groupId,
          status: 'active',
          createdAt: now,
        };
      });

      state.tournamentsById[tournamentId] = {
        id: tournamentId,
        name: payload.name.trim(),
        status: 'upcoming',
        formatType: payload.formatType,
        competitionType: payload.competitionType,
        teamCount: payload.teamCount,
        selectedTeamIds: uniqueTeamIds,
        groupCount: payload.groupCount,
        groupIds,
        seed: payload.seed,
        createdAt: now,
        updatedAt: now,
        winnerTeamId: null,
        settings: {
          ...defaultSettings,
          ...payload.settings,
        },
      };

      state.tournamentIds.unshift(tournamentId);
    },
    updateTournamentStatus(
      state,
      action: PayloadAction<{
        tournamentId: string;
        status: TournamentEntity['status'];
      }>,
    ) {
      const tournament = state.tournamentsById[action.payload.tournamentId];
      if (!tournament) return;
      tournament.status = action.payload.status;
      tournament.updatedAt = new Date().toISOString();
    },
  },
});

export const { createTournament, updateTournamentStatus } =
  tournamentSlice.actions;

export default tournamentSlice.reducer;
