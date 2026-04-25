import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import {
  generateKnockoutFixtures,
  generateRoundRobinFixtures,
} from './fixturesGenerator';
import {
  CreateTournamentPayload,
  TOURNAMENT_BYE_TEAM_ID,
  isTournamentPlaceholderTeamId,
  TournamentFixtureEntity,
  TournamentFixtureManualOutcome,
  TournamentEntity,
  TournamentGroup,
  TournamentSettings,
  TournamentStructureDraftResult,
  TournamentTeam,
} from '../../types/TournamentTypes';
import { generateTournamentSchedulePlan } from './tournamentScheduleGenerator';
import type { FixtureSlotPatch } from './tournamentBracketProgress';

interface TournamentState {
  tournamentsById: Record<string, TournamentEntity>;
  tournamentIds: string[];
  groupsById: Record<string, TournamentGroup>;
  tournamentTeamsById: Record<string, TournamentTeam>;
  fixturesById: Record<string, TournamentFixtureEntity>;
  fixtureIdsByTournamentId: Record<string, string[]>;
  /**
   * Transient UI bridge: `AddFromSavedTeamsScreen` writes here; create flow consumes and clears.
   * Not part of domain model (may exist in persisted state until consumed).
   */
  pickFromSavedTeamsResult: string[] | null;
  /**
   * Transient UI bridge: `ChooseTeamsScreen` confirm writes here; `CreateTournamentFlow` consumes and clears.
   * Avoids navigating to createTournament (which can push a new instance and reset the wizard).
   */
  confirmChooseTeamsResult: string[] | null;
  /** Transient: `TournamentStructureScreen` saves here; create flow consumes and clears. */
  tournamentStructureResult: TournamentStructureDraftResult | null;
}

export type GenerateTournamentFixturesPayload = {
  tournamentId: string;
  mode: 'round_robin' | 'knockout';
  overs: number | null;
  playersPerTeam?: number | null;
  doubleRoundRobin?: boolean;
  startAtIso?: string | null;
  /**
   * fixed / random: spread fixtures across days using matches-per-day rules.
   * untimed_same_day: create all fixtures with scheduledAt null (no times).
   */
  matchesPerDayMode?: 'fixed' | 'random' | 'untimed_same_day';
  matchesPerDay?: 1 | 2;
  randomMinPerDay?: number;
  randomMaxPerDay?: number;
  allowedWeekdays?: number[];
  qualifiersPerGroup?: number | null;
};

export type GenerateFullTournamentSchedulePayload = {
  tournamentId: string;
  overs: number | null;
  playersPerTeam?: number | null;
  doubleRoundRobin?: boolean;
  startAtIso?: string | null;
  matchesPerDayMode?: 'fixed' | 'random' | 'untimed_same_day';
  matchesPerDay?: 1 | 2;
  randomMinPerDay?: number;
  randomMaxPerDay?: number;
  allowedWeekdays?: number[];
  /** Multiple groups: top N per group. Open pool: same value stored as openGroupQualifiers. */
  qualifiersPerGroup?: number | null;
  openGroupQualifiers?: number | null;
  knockoutEnabled: boolean;
  /** Display names for schedule generation (Redux tournament slice has no team names). */
  teamNamesById: Record<string, string>;
  /** When true, clears and rebuilds even if fixtures already exist. */
  forceRegenerate?: boolean;
};

const initialState: TournamentState = {
  tournamentsById: {},
  tournamentIds: [],
  groupsById: {},
  tournamentTeamsById: {},
  fixturesById: {},
  fixtureIdsByTournamentId: {},
  pickFromSavedTeamsResult: null,
  confirmChooseTeamsResult: null,
  tournamentStructureResult: null,
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

type TimedSchedulePayload = {
  tournamentId: string;
  startAtIso?: string | null;
  matchesPerDayMode?: 'fixed' | 'random' | 'untimed_same_day';
  matchesPerDay?: 1 | 2;
  randomMinPerDay?: number;
  randomMaxPerDay?: number;
  allowedWeekdays?: number[];
};

function pushFixtureEntitiesWithTiming(
  state: any,
  tournamentId: string,
  entities: TournamentFixtureEntity[],
  action: TimedSchedulePayload,
) {
  if (!state.fixtureIdsByTournamentId[tournamentId]) {
    state.fixtureIdsByTournamentId[tournamentId] = [];
  }

  const scheduleMode = action.matchesPerDayMode ?? 'fixed';
  const now = new Date().toISOString();
  const startAtIso = action.startAtIso ?? null;

  const commit = (entity: TournamentFixtureEntity, scheduledAt: string | null) => {
    state.fixturesById[entity.id] = {
      ...entity,
      scheduledAt,
      updatedAt: now,
    };
    state.fixtureIdsByTournamentId[tournamentId].push(entity.id);
  };

  if (scheduleMode === 'untimed_same_day') {
    entities.forEach(e => commit(e, null));
    return;
  }

  const gapDays = 1;
  const slotGapHours = 4;
  const allowedWeekdays = Array.isArray(action.allowedWeekdays)
    ? action.allowedWeekdays
    : [0, 1, 2, 3, 4, 5, 6];
  const allowedSet = new Set(
    allowedWeekdays
      .map(n => Number(n))
      .filter(n => Number.isFinite(n) && n >= 0 && n <= 6),
  );
  if (allowedSet.size === 0) {
    [0, 1, 2, 3, 4, 5, 6].forEach(d => allowedSet.add(d));
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

  const mode = scheduleMode;
  const fixedPerDay = action.matchesPerDay === 2 ? 2 : 1;
  const minPerDay =
    mode === 'random'
      ? Math.max(1, Math.floor(Number(action.randomMinPerDay ?? 1)))
      : fixedPerDay;
  const maxPerDay =
    mode === 'random'
      ? Math.max(minPerDay, Math.floor(Number(action.randomMaxPerDay ?? minPerDay)))
      : fixedPerDay;
  const rand = createSeededRandom(`${tournamentId}-${startAtIso ?? ''}-${now}`);

  let dayIndex = 0;
  let slotIndex = 0;
  let dayCapacity =
    mode === 'random' ? minPerDay + Math.floor(rand() * (maxPerDay - minPerDay + 1)) : fixedPerDay;

  const baseMs =
    startAtIso && dayjs(startAtIso).isValid() ? dayjs(startAtIso).valueOf() : null;

  const isAllowedDay = (ms: number) =>
    dayjs(ms).isValid() ? allowedSet.has(dayjs(ms).day()) : false;

  const advanceToNextAllowedDay = () => {
    if (baseMs == null) return;
    while (!isAllowedDay(baseMs + dayIndex * gapDays * 86400000)) {
      dayIndex += 1;
    }
  };

  advanceToNextAllowedDay();

  entities.forEach(entity => {
    const scheduledAt = (() => {
      if (baseMs == null) return null;
      const dayOffsetMs = dayIndex * gapDays * 86400000;
      const slotOffsetMs = slotIndex * slotGapHours * 3600000;
      return dayjs(baseMs + dayOffsetMs + slotOffsetMs).toDate().toISOString();
    })();
    commit(entity, scheduledAt);
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
  });
}

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
      if (payload.teamCount < 3) return;
      if (uniqueTeamIds.length !== payload.teamCount) return;
      if (uniqueTeamIds.length !== payload.selectedTeamIds.length) return;
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

      const groupIds = isGroupBased
        ? payload.groups.map(group => {
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
          })
        : (() => {
            const groupId = createId('group');
            state.groupsById[groupId] = {
              id: groupId,
              tournamentId,
              name: 'Open Group',
              order: 1,
              teamIds: [...uniqueTeamIds],
              createdAt: now,
            };
            return [groupId];
          })();

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
        groupCount: isGroupBased ? payload.groupCount : 1,
        groupIds,
        seed: payload.seed,
        createdAt: now,
        updatedAt: now,
        winnerTeamId: null,
        settings: {
          ...defaultSettings,
          ...(payload.settings ?? {}),
          tournamentScheduleFormat: isGroupBased ? 'MULTIPLE_GROUPS' : 'OPEN_GROUP',
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
      if (
        isTournamentPlaceholderTeamId(fixture.teamAId) ||
        isTournamentPlaceholderTeamId(fixture.teamBId) ||
        fixture.teamAId === TOURNAMENT_BYE_TEAM_ID ||
        fixture.teamBId === TOURNAMENT_BYE_TEAM_ID
      ) {
        return;
      }

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
        /** Winner club team id when match completed normally (used for knockout progression). */
        winnerTeamId?: string | null;
        /** Set when finishing from match settings without scoring; cleared when omitted. */
        manualOutcome?: TournamentFixtureManualOutcome | null;
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

      fixture.manualOutcome =
        action.payload.manualOutcome === undefined ? null : action.payload.manualOutcome;

      const w = action.payload.winnerTeamId;
      if (
        action.payload.status === 'completed' &&
        w &&
        fixture.stage === 'KNOCKOUT' &&
        fixture.advancesWinnerToFixtureId &&
        fixture.advancesWinnerAs
      ) {
        fixture.winnerTeamId = w;
        const next = state.fixturesById[fixture.advancesWinnerToFixtureId];
        if (next) {
          if (fixture.advancesWinnerAs === 'teamA') {
            next.teamAId = w;
            next.teamAPlaceholder = null;
          } else {
            next.teamBId = w;
            next.teamBPlaceholder = null;
          }
          next.updatedAt = now;
        }
      }

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
      const t = state.tournamentsById[action.payload.tournamentId];
      if (t) {
        t.settings = { ...(t.settings ?? defaultSettings), fixturesGenerated: false };
        t.updatedAt = new Date().toISOString();
      }
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
      const playersPerTeam = action.payload.playersPerTeam ?? null;
      const startAtIso = action.payload.startAtIso ?? null;

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

      type FixtureRow = {
        teamAId: string;
        teamBId: string;
        roundLabel: string;
        groupId: string | null;
      };

      const addFixture = (
        f: FixtureRow,
        scheduledAt: string | null,
      ) => {
        if (f.teamAId === f.teamBId) return;
        const fixtureId = createId('fixture');
        state.fixturesById[fixtureId] = {
          id: fixtureId,
          tournamentId: action.payload.tournamentId,
          teamAId: f.teamAId,
          teamBId: f.teamBId,
          overs,
          playersPerTeam,
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
      };

      const teamIds = tournament.selectedTeamIds ?? [];
      const fixtureRows: FixtureRow[] = [];

      if (action.payload.mode === 'knockout') {
        fixtureRows.push(...generateKnockoutFixtures({ teamIds }));
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
            fixtureRows.push(...base);
            if (doubleRoundRobin) {
              fixtureRows.push(
                ...base.map(item => ({
                  ...item,
                  teamAId: item.teamBId,
                  teamBId: item.teamAId,
                  roundLabel: `${item.roundLabel} (Return)`,
                })),
              );
            }
          });
        } else {
          const openGroupId = tournament.groupIds?.[0] ?? null;
          const openGroup = openGroupId ? state.groupsById[openGroupId] : null;
          const base = generateRoundRobinFixtures({
            teamIds: openGroup?.teamIds?.length ? openGroup.teamIds : teamIds,
            groupId: openGroupId,
            roundPrefix: openGroup?.name ?? 'Open Group',
          });
          fixtureRows.push(...base);
          if (doubleRoundRobin) {
            fixtureRows.push(
              ...base.map(item => ({
                ...item,
                teamAId: item.teamBId,
                teamBId: item.teamAId,
                roundLabel: `${item.roundLabel} (Return)`,
              })),
            );
          }
        }
      }

      const scheduleMode = action.payload.matchesPerDayMode ?? 'fixed';

      if (scheduleMode === 'untimed_same_day') {
        fixtureRows.forEach(r => addFixture(r, null));
      } else {
        const gapDays = 1;
        const slotGapHours = 4;
        const allowedWeekdays = Array.isArray(action.payload.allowedWeekdays)
          ? action.payload.allowedWeekdays
          : [0, 1, 2, 3, 4, 5, 6];
        const allowedSet = new Set(
          allowedWeekdays
            .map(n => Number(n))
            .filter(n => Number.isFinite(n) && n >= 0 && n <= 6),
        );
        if (allowedSet.size === 0) {
          [0, 1, 2, 3, 4, 5, 6].forEach(d => allowedSet.add(d));
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

        const mode = scheduleMode;
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

        let dayIndex = 0;
        let slotIndex = 0;
        let dayCapacity =
          mode === 'random'
            ? minPerDay + Math.floor(rand() * (maxPerDay - minPerDay + 1))
            : fixedPerDay;

        const baseMs =
          startAtIso && dayjs(startAtIso).isValid() ? dayjs(startAtIso).valueOf() : null;

        const isAllowedDay = (ms: number) =>
          dayjs(ms).isValid() ? allowedSet.has(dayjs(ms).day()) : false;

        const advanceToNextAllowedDay = () => {
          if (baseMs == null) return;
          while (!isAllowedDay(baseMs + dayIndex * gapDays * 86400000)) {
            dayIndex += 1;
          }
        };

        advanceToNextAllowedDay();

        const pushTimedRow = (f: FixtureRow) => {
          if (f.teamAId === f.teamBId) return;
          const scheduledAt = (() => {
            if (baseMs == null) return null;
            const dayOffsetMs = dayIndex * gapDays * 86400000;
            const slotOffsetMs = slotIndex * slotGapHours * 3600000;
            return dayjs(baseMs + dayOffsetMs + slotOffsetMs).toDate().toISOString();
          })();
          addFixture(f, scheduledAt);
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

        fixtureRows.forEach(pushTimedRow);
      }

      tournament.updatedAt = now;
    },

    generateFullTournamentSchedule(
      state,
      action: PayloadAction<GenerateFullTournamentSchedulePayload>,
    ) {
      if (!state.fixturesById) state.fixturesById = {};
      if (!state.fixtureIdsByTournamentId) state.fixtureIdsByTournamentId = {};

      const tournament = state.tournamentsById[action.payload.tournamentId];
      if (!tournament) return;

      const tournamentId = action.payload.tournamentId;

      if (
        !action.payload.forceRegenerate &&
        tournament.settings?.fixturesGenerated &&
        (state.fixtureIdsByTournamentId[tournamentId]?.length ?? 0) > 0
      ) {
        return;
      }

      const existing = state.fixtureIdsByTournamentId[tournamentId] ?? [];
      existing.forEach(id => delete state.fixturesById[id]);
      state.fixtureIdsByTournamentId[tournamentId] = [];

      const now = new Date().toISOString();
      const overs = action.payload.overs ?? null;
      const playersPerTeam = action.payload.playersPerTeam ?? null;

      const groupSizes = (tournament.groupIds ?? [])
        .map(id => state.groupsById[id]?.teamIds?.length ?? 0)
        .filter(n => n > 0);
      const minG = groupSizes.length ? Math.min(...groupSizes) : 1;

      let qualify = 1;
      if (tournament.formatType === 'open') {
        const raw =
          action.payload.openGroupQualifiers ??
          action.payload.qualifiersPerGroup ??
          tournament.settings?.openGroupQualifiers ??
          tournament.settings?.qualifiersPerGroup ??
          2;
        qualify = Math.max(1, Math.min(Math.floor(Number(raw)), tournament.teamCount));
      } else {
        const raw = action.payload.qualifiersPerGroup ?? tournament.settings?.qualifiersPerGroup ?? 2;
        qualify = Math.max(1, Math.min(Math.floor(Number(raw)), minG));
      }

      tournament.settings = {
        ...(tournament.settings ?? defaultSettings),
        knockoutEnabled: action.payload.knockoutEnabled,
        qualifiersPerGroup: qualify,
        openGroupQualifiers: tournament.formatType === 'open' ? qualify : tournament.settings?.openGroupQualifiers,
        fixturesGenerated: true,
      };
      if (typeof action.payload.doubleRoundRobin === 'boolean') {
        tournament.settings.roundRobinLegs = action.payload.doubleRoundRobin ? 2 : 1;
      }

      const knockoutOn = action.payload.knockoutEnabled && qualify > 0;

      const groupsMeta = (tournament.groupIds ?? [])
        .map(id => state.groupsById[id])
        .filter(Boolean)
        .sort((a, b) => a.order - b.order)
        .map(g => ({ id: g.id, name: g.name, teamIds: [...g.teamIds] }));

      const teamRefs = tournament.selectedTeamIds.map(id => ({
        id,
        name: action.payload.teamNamesById[id] ?? 'Team',
      }));

      const plan = generateTournamentSchedulePlan({
        teams: teamRefs,
        scheduleFormat: tournament.formatType === 'open' ? 'OPEN_GROUP' : 'MULTIPLE_GROUPS',
        numberOfGroups: tournament.groupCount ?? 1,
        existingGroups: groupsMeta,
        knockoutEnabled: knockoutOn,
        qualifyPerGroup: qualify,
      });

      const doubleRoundRobin =
        action.payload.doubleRoundRobin ?? tournament.settings?.roundRobinLegs === 2;

      const entities: TournamentFixtureEntity[] = [];
      let matchSeq = 0;

      const pushGroup = (gf: (typeof plan.groupFixtures)[number]) => {
        const id = createId('fixture');
        matchSeq += 1;
        const bye =
          gf.teamAId === TOURNAMENT_BYE_TEAM_ID || gf.teamBId === TOURNAMENT_BYE_TEAM_ID;
        entities.push({
          id,
          tournamentId,
          teamAId: gf.teamAId,
          teamBId: gf.teamBId,
          overs,
          playersPerTeam,
          status: bye ? 'completed' : 'upcoming',
          venue: null,
          roundLabel: gf.roundLabel,
          groupId: gf.groupId,
          createdAt: now,
          updatedAt: now,
          matchId: null,
          resultSummary: bye ? 'Bye (no fixture)' : null,
          stage: 'GROUP',
          roundNumber: gf.roundNumber,
          matchNumber: matchSeq,
          knockoutRound: null,
          teamAPlaceholder: null,
          teamBPlaceholder: null,
          teamASeed: null,
          teamBSeed: null,
          advancesWinnerToFixtureId: null,
          advancesWinnerAs: null,
          winnerTeamId: bye
            ? gf.teamAId === TOURNAMENT_BYE_TEAM_ID
              ? gf.teamBId
              : gf.teamAId
            : null,
          scheduledAt: null,
        });
      };

      plan.groupFixtures.forEach(gf => {
        pushGroup(gf);
        if (doubleRoundRobin) {
          pushGroup({
            ...gf,
            teamAId: gf.teamBId,
            teamBId: gf.teamAId,
            roundLabel: `${gf.roundLabel} (Return)`,
            roundNumber: gf.roundNumber,
          });
        }
      });

      const keyToId: Record<string, string> = {};
      plan.knockoutFixtures.forEach(kf => {
        keyToId[kf.tempKey] = createId('fixture');
      });

      plan.knockoutFixtures.forEach(kf => {
        const id = keyToId[kf.tempKey];
        entities.push({
          id,
          tournamentId,
          teamAId: kf.teamAId,
          teamBId: kf.teamBId,
          overs,
          playersPerTeam,
          status: 'upcoming',
          venue: null,
          roundLabel: kf.roundName,
          groupId: null,
          createdAt: now,
          updatedAt: now,
          matchId: null,
          resultSummary: null,
          stage: 'KNOCKOUT',
          roundNumber: kf.roundNumber,
          matchNumber: kf.matchNumber,
          knockoutRound: kf.knockoutRound ?? null,
          teamAPlaceholder: kf.teamAPlaceholder,
          teamBPlaceholder: kf.teamBPlaceholder,
          teamASeed: kf.teamASeed,
          teamBSeed: kf.teamBSeed,
          advancesWinnerToFixtureId: kf.advancesWinnerToTempKey
            ? keyToId[kf.advancesWinnerToTempKey] ?? null
            : null,
          advancesWinnerAs: kf.advancesWinnerAs,
          winnerTeamId: null,
          scheduledAt: null,
        });
      });

      pushFixtureEntitiesWithTiming(state, tournamentId, entities, action.payload);

      tournament.updatedAt = now;
    },

    applyFixtureSlotPatches(
      state,
      action: PayloadAction<{ tournamentId: string; patches: FixtureSlotPatch[] }>,
    ) {
      if (!state.fixturesById) state.fixturesById = {};
      const now = new Date().toISOString();
      action.payload.patches.forEach(p => {
        const f = state.fixturesById[p.fixtureId];
        if (!f || f.tournamentId !== action.payload.tournamentId) return;
        if (typeof p.teamAId !== 'undefined') f.teamAId = p.teamAId as string;
        if (typeof p.teamBId !== 'undefined') f.teamBId = p.teamBId as string;
        if (typeof p.teamAPlaceholder !== 'undefined') f.teamAPlaceholder = p.teamAPlaceholder;
        if (typeof p.teamBPlaceholder !== 'undefined') f.teamBPlaceholder = p.teamBPlaceholder;
        if (typeof p.teamASeed !== 'undefined') f.teamASeed = p.teamASeed;
        if (typeof p.teamBSeed !== 'undefined') f.teamBSeed = p.teamBSeed;
        f.updatedAt = now;
      });
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
        playersPerTeam?: number | null;
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

      if (typeof action.payload.playersPerTeam !== 'undefined') {
        const p = action.payload.playersPerTeam;
        if (p == null) {
          fixture.playersPerTeam = null;
        } else if (Number.isFinite(p) && p > 0 && p <= 30) {
          fixture.playersPerTeam = Math.floor(p);
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

    submitPickFromSavedTeamsResult(state, action: PayloadAction<string[]>) {
      state.pickFromSavedTeamsResult = [...action.payload];
    },
    clearPickFromSavedTeamsResult(state) {
      state.pickFromSavedTeamsResult = null;
    },

    submitConfirmChooseTeamsResult(state, action: PayloadAction<string[]>) {
      state.confirmChooseTeamsResult = [...action.payload];
    },
    clearConfirmChooseTeamsResult(state) {
      state.confirmChooseTeamsResult = null;
    },

    submitTournamentStructureResult(state, action: PayloadAction<TournamentStructureDraftResult>) {
      state.tournamentStructureResult = { ...action.payload };
    },
    clearTournamentStructureResult(state) {
      state.tournamentStructureResult = null;
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
  generateFullTournamentSchedule,
  applyFixtureSlotPatches,
  deleteTournamentFixture,
  updateTournamentFixture,
  submitPickFromSavedTeamsResult,
  clearPickFromSavedTeamsResult,
  submitConfirmChooseTeamsResult,
  clearConfirmChooseTeamsResult,
  submitTournamentStructureResult,
  clearTournamentStructureResult,
} =
  tournamentSlice.actions;

export default tournamentSlice.reducer;
