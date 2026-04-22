import type { AppDispatch } from '../store/store';
import type { RootState } from '../store/rootReducer';
import type { PlayerRole } from '../../types/Playertype';
import { addLivePlayerToTeam, addMultipleLivePlayersToTeam, updateLivePlayerRole } from './matchSlice';
import { updateTeam } from '../teams/teamsSlice';

const normalizeName = (value: string) => (value ?? '').trim().replace(/\s+/g, ' ');

export function addLivePlayerAndPersist(payload: {
  teamKey: 'teamA' | 'teamB';
  name: string;
  role?: PlayerRole;
  lateAdded?: boolean;
}) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(addLivePlayerToTeam(payload));

    const state = getState();
    const match = state.match.currentMatch;
    if (!match) return;
    const sourceId =
      payload.teamKey === 'teamA' ? match.sourceTeamAId : match.sourceTeamBId;
    if (!sourceId) return;

    const teamEntity = state.teams.byId[sourceId];
    if (!teamEntity) return;

    const nm = normalizeName(payload.name);
    const exists = (teamEntity.players ?? []).some(
      p => normalizeName(p.name).toLowerCase() === nm.toLowerCase(),
    );
    if (exists) return;

    dispatch(
      updateTeam({
        id: teamEntity.id,
        name: teamEntity.name,
        shortName: teamEntity.shortName,
        playerAddTiming: teamEntity.playerAddTiming,
        players: [
          ...(teamEntity.players ?? []).map(p => ({ name: p.name, role: p.role })),
          { name: nm, role: (payload.role ?? 'batsman') as PlayerRole },
        ],
      }),
    );
  };
}

export function addMultipleLivePlayersAndPersist(payload: {
  teamKey: 'teamA' | 'teamB';
  names: string[];
  role?: PlayerRole;
  lateAdded?: boolean;
}) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(
      addMultipleLivePlayersToTeam({
        teamKey: payload.teamKey,
        names: payload.names,
        role: payload.role,
        defaults: { lateAdded: payload.lateAdded },
      }),
    );

    const state = getState();
    const match = state.match.currentMatch;
    if (!match) return;
    const sourceId =
      payload.teamKey === 'teamA' ? match.sourceTeamAId : match.sourceTeamBId;
    if (!sourceId) return;

    const teamEntity = state.teams.byId[sourceId];
    if (!teamEntity) return;

    const existingLower = new Set(
      (teamEntity.players ?? []).map(p => normalizeName(p.name).toLowerCase()),
    );
    const addNames = (payload.names ?? [])
      .map(n => normalizeName(n))
      .filter(Boolean)
      .filter(n => !existingLower.has(n.toLowerCase()));
    if (addNames.length === 0) return;

    dispatch(
      updateTeam({
        id: teamEntity.id,
        name: teamEntity.name,
        shortName: teamEntity.shortName,
        playerAddTiming: teamEntity.playerAddTiming,
        players: [
          ...(teamEntity.players ?? []).map(p => ({ name: p.name, role: p.role })),
          ...addNames.map(n => ({ name: n, role: (payload.role ?? 'batsman') as PlayerRole })),
        ],
      }),
    );
  };
}

export function updateLivePlayerRoleAndPersist(payload: {
  teamKey: 'teamA' | 'teamB';
  playerId: number;
  role?: PlayerRole;
  playerName?: string;
}) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(updateLivePlayerRole({ teamKey: payload.teamKey, playerId: payload.playerId, role: payload.role }));

    const state = getState();
    const match = state.match.currentMatch;
    if (!match) return;
    const sourceId =
      payload.teamKey === 'teamA' ? match.sourceTeamAId : match.sourceTeamBId;
    if (!sourceId) return;

    const teamEntity = state.teams.byId[sourceId];
    if (!teamEntity) return;

    const nm = normalizeName(payload.playerName ?? '');
    if (!nm) return;

    const nextPlayers = (teamEntity.players ?? []).map(p => {
      if (normalizeName(p.name).toLowerCase() !== nm.toLowerCase()) return { name: p.name, role: p.role };
      return { name: p.name, role: (payload.role ?? p.role) as PlayerRole };
    });

    dispatch(
      updateTeam({
        id: teamEntity.id,
        name: teamEntity.name,
        shortName: teamEntity.shortName,
        playerAddTiming: teamEntity.playerAddTiming,
        players: nextPlayers,
      }),
    );
  };
}

