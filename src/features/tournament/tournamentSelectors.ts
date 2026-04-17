import { RootState } from '../store/rootReducer';

export const selectTeamsState = (state: RootState) => state.teams;
export const selectTournamentState = (state: RootState) => state.tournament;

export const selectAllTeams = (state: RootState) =>
  state.teams.allIds.map(id => state.teams.byId[id]).filter(Boolean);

export const selectActiveTeams = (state: RootState) =>
  selectAllTeams(state).filter(team => !team.isArchived);

export const selectAllTournaments = (state: RootState) =>
  state.tournament.tournamentIds
    .map(id => state.tournament.tournamentsById[id])
    .filter(Boolean);

export const selectTournamentById = (state: RootState, tournamentId: string) =>
  state.tournament.tournamentsById[tournamentId] ?? null;

export const selectTournamentGroups = (state: RootState, tournamentId: string) => {
  const tournament = selectTournamentById(state, tournamentId);
  if (!tournament) return [];

  return tournament.groupIds
    .map(id => state.tournament.groupsById[id])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
};

export const selectTournamentTeams = (state: RootState, tournamentId: string) => {
  const tournament = selectTournamentById(state, tournamentId);
  if (!tournament) return [];

  return tournament.selectedTeamIds
    .map(teamId => state.teams.byId[teamId])
    .filter(Boolean);
};
