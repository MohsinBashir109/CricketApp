import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import {
  generateKnockoutFixtures,
  generateRoundRobinFixtures,
} from './fixturesGenerator';
import {
  CreateTournamentPayload,
  TournamentFixtureEntity,
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
  fixturesById: Record<string, TournamentFixtureEntity>;
  fixtureIdsByTournamentId: Record<string, string[]>;
}

export type GenerateTournamentFixturesPayload = {
  tournamentId: string;
  mode: 'round_robin' | 'knockout';
  overs: number | null;
  doubleRoundRobin?: boolean;
  startAtIso?: string | null;
  matchesPerDayMode?: 'fixed' | 'random';
  matchesPerDay?: 1 | 2;
  randomMinPerDay?: number;
  randomMaxPerDay?: number;
  allowedWeekdays?: number[];
  qualifiersPerGroup?: number | null;
};

const initialState: TournamentState = {
  tournamentsById: {},
  tournamentIds: [],
  groupsById: {},
  tournamentTeamsById: {},
  fixturesById: {},
  fixtureIdsByTournamentId: {},
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultSettings: TournamentSettings = {
  allowRegenerateGroupsBeforeStart: true,
  autoCreateGroups: true,
  roundRobinLegs: 1,
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
      // Backwards-compatible hydration: older persisted state won't have these keys.
      if (!state.fixturesById) state.fixturesById = {};
      if (!state.fixtureIdsByTournamentId) state.fixtureIdsByTournamentId = {};

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
          ...(payload.settings ?? {}),
        },
      };

      state.tournamentIds.unshift(tournamentId);
      if (!state.fixtureIdsByTournamentId[tournamentId]) {
        state.fixtureIdsByTournamentId[tournamentId] = [];
      }
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

    addTournamentFixture(
      state,
      action: PayloadAction<{
        tournamentId: string;
        teamAId: string;
        teamBId: string;
        overs: number | null;
        scheduledAt?: string | null;
        venue?: string | null;
        roundLabel?: string | null;
        groupId?: string | null;
      }>,
    ) {
      if (!state.fixturesById) state.fixturesById = {};
      if (!state.fixtureIdsByTournamentId) state.fixtureIdsByTournamentId = {};

      const t = state.tournamentsById[action.payload.tournamentId];
      if (!t) return;
      if (action.payload.teamAId === action.payload.teamBId) return;

      const now = new Date().toISOString();
      const fixtureId = createId('fixture');
      state.fixturesById[fixtureId] = {
        id: fixtureId,
        tournamentId: action.payload.tournamentId,
        teamAId: action.payload.teamAId,
        teamBId: action.payload.teamBId,
        overs: action.payload.overs,
        status: 'upcoming',
        scheduledAt: action.payload.scheduledAt ?? null,
        venue: action.payload.venue ?? null,
        roundLabel: action.payload.roundLabel ?? null,
        groupId: action.payload.groupId ?? null,
        createdAt: now,
        updatedAt: now,
        matchId: null,
        resultSummary: null,
      };
      if (!state.fixtureIdsByTournamentId[action.payload.tournamentId]) {
        state.fixtureIdsByTournamentId[action.payload.tournamentId] = [];
      }
      state.fixtureIdsByTournamentId[action.payload.tournamentId].push(fixtureId);
      t.updatedAt = now;
    },

    setFixtureLive(
      state,
      action: PayloadAction<{
        tournamentId: string;
        fixtureId: string;
        matchId: string;
      }>,
    ) {
      if (!state.fixturesById) state.fixturesById = {};
      if (!state.fixtureIdsByTournamentId) state.fixtureIdsByTournamentId = {};

      const fixture = state.fixturesById[action.payload.fixtureId];
      const t = state.tournamentsById[action.payload.tournamentId];
      if (!fixture || !t) return;
      if (fixture.tournamentId !== action.payload.tournamentId) return;
      if (fixture.status === 'completed') return;

      const now = new Date().toISOString();
      fixture.status = 'live';
      fixture.matchId = action.payload.matchId;
      fixture.updatedAt = now;
      if (t.status === 'upcoming') t.status = 'ongoing';
      t.updatedAt = now;
    },

    completeFixture(
      state,
      action: PayloadAction<{
        tournamentId: string;
        fixtureId: string;
        status: 'completed' | 'no_result' | 'abandoned';
        resultSummary: string;
      }>,
    ) {
      if (!state.fixturesById) state.fixturesById = {};
      if (!state.fixtureIdsByTournamentId) state.fixtureIdsByTournamentId = {};

      const fixture = state.fixturesById[action.payload.fixtureId];
      const t = state.tournamentsById[action.payload.tournamentId];
      if (!fixture || !t) return;
      if (fixture.tournamentId !== action.payload.tournamentId) return;

      const now = new Date().toISOString();
      fixture.status = action.payload.status;
      fixture.resultSummary = action.payload.resultSummary;
      fixture.updatedAt = now;
      t.updatedAt = now;

      // Auto-progress tournament status based on fixtures.
      const ids = state.fixtureIdsByTournamentId[action.payload.tournamentId] ?? [];
      const fixtures = ids.map(id => state.fixturesById[id]).filter(Boolean);
      const hasLive = fixtures.some(f => f.status === 'live');
      const hasUpcoming = fixtures.some(f => f.status === 'upcoming');
      const hasAnyPlayed = fixtures.some(f =>
        ['completed', 'no_result', 'abandoned'].includes(f.status),
      );
      const allFinished =
        fixtures.length > 0 &&
        fixtures.every(f => ['completed', 'no_result', 'abandoned', 'cancelled'].includes(f.status));

      if (allFinished) t.status = 'completed';
      else if (hasLive || hasAnyPlayed) t.status = 'ongoing';
      else if (hasUpcoming) t.status = 'upcoming';
    },

    clearTournamentFixtures(state, action: PayloadAction<{ tournamentId: string }>) {
      if (!state.fixturesById) state.fixturesById = {};
      if (!state.fixtureIdsByTournamentId) state.fixtureIdsByTournamentId = {};

      const ids = state.fixtureIdsByTournamentId[action.payload.tournamentId] ?? [];
      ids.forEach(id => {
        delete state.fixturesById[id];
      });
      state.fixtureIdsByTournamentId[action.payload.tournamentId] = [];
    },

    generateTournamentFixtures(
      state,
      action: PayloadAction<GenerateTournamentFixturesPayload>,
    ) {
      if (!state.fixturesById) state.fixturesById = {};
      if (!state.fixtureIdsByTournamentId) state.fixtureIdsByTournamentId = {};

      const tournament = state.tournamentsById[action.payload.tournamentId];
      if (!tournament) return;

      // Robust behavior: generating fixtures always overrides existing fixtures.
      const existing = state.fixtureIdsByTournamentId[action.payload.tournamentId] ?? [];
      existing.forEach(id => delete state.fixturesById[id]);
      state.fixtureIdsByTournamentId[action.payload.tournamentId] = [];

      const now = new Date().toISOString();
      const overs = action.payload.overs ?? null;
      const startAtIso = action.payload.startAtIso ?? null;
      const gapDays = 1;
      const slotGapHours = 4; // 2 matches/day: second match 4 hours later
      const allowedWeekdays = Array.isArray(action.payload.allowedWeekdays)
        ? action.payload.allowedWeekdays
        : [0, 1, 2, 3, 4, 5, 6];
      const allowedSet = new Set(
        allowedWeekdays
          .map(n => Number(n))
          .filter(n => Number.isFinite(n) && n >= 0 && n <= 6),
      );
      if (allowedSet.size === 0) {
        // fallback to all days to avoid infinite loops
        [0, 1, 2, 3, 4, 5, 6].forEach(d => allowedSet.add(d));
      }

      // Save group qualification rule (used later for knockout progression).
      if (tournament.formatType === 'groupBased') {
        const q = action.payload.qualifiersPerGroup;
        if (typeof q === 'number' && Number.isFinite(q) && q >= 1) {
          // Bound by smallest group size so the setting is always valid.
          const groupSizes = (tournament.groupIds ?? [])
            .map(id => state.groupsById[id]?.teamIds?.length ?? 0)
            .filter(n => n > 0);
          const maxAllowed = groupSizes.length ? Math.min(...groupSizes) : q;
          const bounded = Math.min(Math.floor(q), Math.max(1, maxAllowed));
          tournament.settings = { ...(tournament.settings ?? defaultSettings), qualifiersPerGroup: bounded };
        }
      }

      const seededHash = (seed: string) => {
        let hash = 2166136261;
        for (let i = 0; i < seed.length; i += 1) {
          hash ^= seed.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
      };
      const createSeededRandom = (seed: string) => {
        let s = seededHash(seed) || 1;
        return () => {
          s = (s * 1664525 + 1013904223) >>> 0;
          return s / 0x100000000;
        };
      };

      const mode = action.payload.matchesPerDayMode ?? 'fixed';
      const fixedPerDay = action.payload.matchesPerDay === 2 ? 2 : 1;
      const minPerDay =
        mode === 'random'
          ? Math.max(1, Math.floor(Number(action.payload.randomMinPerDay ?? 1)))
          : fixedPerDay;
      const maxPerDay =
        mode === 'random'
          ? Math.max(minPerDay, Math.floor(Number(action.payload.randomMaxPerDay ?? minPerDay)))
          : fixedPerDay;
      const rand = createSeededRandom(
        `${action.payload.tournamentId}-${startAtIso ?? ''}-${now}`,
      );

      let fixtureIndex = 0;
      let dayIndex = 0;
      let slotIndex = 0;
      let dayCapacity = mode === 'random'
        ? minPerDay + Math.floor(rand() * (maxPerDay - minPerDay + 1))
        : fixedPerDay;

      const baseMs =
        startAtIso && dayjs(startAtIso).isValid() ? dayjs(startAtIso).valueOf() : null;

      const isAllowedDay = (ms: number) =>
        dayjs(ms).isValid() ? allowedSet.has(dayjs(ms).day()) : false;

      const advanceToNextAllowedDay = () => {
        if (baseMs == null) return;
        // move forward until day is allowed
        while (!isAllowedDay(baseMs + dayIndex * gapDays * 86400000)) {
          dayIndex += 1;
        }
      };

      // Ensure first day is allowed.
      advanceToNextAllowedDay();

      const pushFixture = (f: {
        teamAId: string;
        teamBId: string;
        roundLabel: string;
        groupId: string | null;
      }) => {
        if (f.teamAId === f.teamBId) return;
        const scheduledAt = (() => {
          if (baseMs == null) return null;
          const dayOffsetMs = dayIndex * gapDays * 86400000;
          const slotOffsetMs = slotIndex * slotGapHours * 3600000;
          return dayjs(baseMs + dayOffsetMs + slotOffsetMs).toDate().toISOString();
        })();

        const fixtureId = createId('fixture');
        state.fixturesById[fixtureId] = {
          id: fixtureId,
          tournamentId: action.payload.tournamentId,
          teamAId: f.teamAId,
          teamBId: f.teamBId,
          overs,
          status: 'upcoming',
          scheduledAt,
          venue: null,
          roundLabel: f.roundLabel ?? null,
          groupId: f.groupId ?? null,
          createdAt: now,
          updatedAt: now,
          matchId: null,
          resultSummary: null,
        };
        state.fixtureIdsByTournamentId[action.payload.tournamentId].push(fixtureId);
        fixtureIndex += 1;

        // advance scheduling cursor (per-day capacity can be fixed or random)
        slotIndex += 1;
        if (slotIndex >= dayCapacity) {
          dayIndex += 1;
          slotIndex = 0;
          advanceToNextAllowedDay();
          dayCapacity =
            mode === 'random'
              ? minPerDay + Math.floor(rand() * (maxPerDay - minPerDay + 1))
              : fixedPerDay;
        }
      };

      const teamIds = tournament.selectedTeamIds ?? [];

      if (action.payload.mode === 'knockout') {
        generateKnockoutFixtures({ teamIds }).forEach(pushFixture);
      } else {
        const doubleRoundRobin =
          action.payload.doubleRoundRobin ??
          (tournament.settings?.roundRobinLegs === 2);
        if (tournament.formatType === 'groupBased') {
          // Always generate fixtures for ALL groups.
          const groupIds = tournament.groupIds ?? [];
          if (groupIds.length === 0) return;

          groupIds.forEach(groupId => {
            const group = state.groupsById[groupId];
            if (!group || !group.teamIds?.length) return;
            const roundPrefix = group.name || 'Group';
            const base = generateRoundRobinFixtures({
              teamIds: group.teamIds ?? [],
              groupId,
              roundPrefix,
            });
            base.forEach(pushFixture);
            if (doubleRoundRobin) {
              base
                .map(item => ({
                  ...item,
                  teamAId: item.teamBId,
                  teamBId: item.teamAId,
                  roundLabel: `${item.roundLabel} (Return)`,
                }))
                .forEach(pushFixture);
            }
          });
        } else {
          const base = generateRoundRobinFixtures({
            teamIds,
            groupId: null,
            roundPrefix: 'League',
          });
          base.forEach(pushFixture);
          if (doubleRoundRobin) {
            base
              .map(item => ({
                ...item,
                teamAId: item.teamBId,
                teamBId: item.teamAId,
                roundLabel: `${item.roundLabel} (Return)`,
              }))
              .forEach(pushFixture);
          }
        }
      }

      tournament.updatedAt = now;
    },

    updateTournamentFixture(
      state,
      action: PayloadAction<{
        tournamentId: string;
        fixtureId: string;
        teamAId: string;
        teamBId: string;
        scheduledAt: string;
        overs?: number | null;
        /** Allow marking outcome before scoring starts. */
        status?: TournamentFixtureEntity['status'];
        /** Optional note to display on fixture card. */
        resultSummary?: string | null;
      }>,
    ) {
      if (!state.fixturesById) state.fixturesById = {};
      const fixture = state.fixturesById[action.payload.fixtureId];
      if (!fixture) return;
      if (fixture.tournamentId !== action.payload.tournamentId) return;
      // Only allow edits before scoring starts. Allow changing from upcoming -> no_result/abandoned/cancelled.
      if (fixture.status !== 'upcoming') return;
      if (fixture.matchId) return; // scoring started
      if (action.payload.teamAId === action.payload.teamBId) return;
      if (!dayjs(action.payload.scheduledAt).isValid()) return;

      const now = new Date().toISOString();
      fixture.teamAId = action.payload.teamAId;
      fixture.teamBId = action.payload.teamBId;
      fixture.scheduledAt = action.payload.scheduledAt;

      if (typeof action.payload.overs !== 'undefined') {
        const o = action.payload.overs;
        if (o == null) {
          fixture.overs = null;
        } else if (Number.isFinite(o) && o > 0 && o <= 200) {
          fixture.overs = Math.floor(o);
        }
      }

      if (typeof action.payload.status !== 'undefined') {
        const next = action.payload.status;
        if (next === 'upcoming' || next === 'no_result' || next === 'abandoned' || next === 'cancelled') {
          fixture.status = next;
        }
      }

      if (typeof action.payload.resultSummary !== 'undefined') {
        fixture.resultSummary = action.payload.resultSummary;
      }

      fixture.updatedAt = now;
    },

    deleteTournamentFixture(
      state,
      action: PayloadAction<{ tournamentId: string; fixtureId: string }>,
    ) {
      if (!state.fixturesById) state.fixturesById = {};
      if (!state.fixtureIdsByTournamentId) state.fixtureIdsByTournamentId = {};

      const fixture = state.fixturesById[action.payload.fixtureId];
      if (!fixture) return;
      if (fixture.tournamentId !== action.payload.tournamentId) return;

      // Safety: don't allow deletion for live/completed fixtures.
      if (fixture.status !== 'upcoming') return;

      delete state.fixturesById[action.payload.fixtureId];

      const ids = state.fixtureIdsByTournamentId[action.payload.tournamentId] ?? [];
      state.fixtureIdsByTournamentId[action.payload.tournamentId] = ids.filter(
        id => id !== action.payload.fixtureId,
      );
    },
  },
});

export const {
  createTournament,
  updateTournamentStatus,
  addTournamentFixture,
  setFixtureLive,
  completeFixture,
  clearTournamentFixtures,
  generateTournamentFixtures,
  deleteTournamentFixture,
  updateTournamentFixture,
} =
  tournamentSlice.actions;

export default tournamentSlice.reducer;
