import { RootState } from '../store/rootReducer';
import { MatchSetup } from '../../types/Playertype';
import { TOURNAMENT_BYE_TEAM_ID, TournamentFixtureEntity } from '../../types/TournamentTypes';
import dayjs from 'dayjs';
import { applyManualOutcomeToRows } from './tournamentBracketProgress';
import { computeTournamentStatsSections } from './tournamentStatsLeaderboards';

export const selectTeamsState = (state: RootState) => state.teams;
export const selectTournamentState = (state: RootState) => state.tournament;
export const selectMatchState = (state: RootState) => state.match;

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

export const selectTournamentFixtures = (state: RootState, tournamentId: string) => {
  const ids = state.tournament.fixtureIdsByTournamentId[tournamentId] ?? [];
  return ids
    .map(id => state.tournament.fixturesById[id])
    .filter(Boolean)
    .sort((a, b) => {
      const aTime =
        a.scheduledAt && dayjs(a.scheduledAt).isValid() ? dayjs(a.scheduledAt).valueOf() : 0;
      const bTime =
        b.scheduledAt && dayjs(b.scheduledAt).isValid() ? dayjs(b.scheduledAt).valueOf() : 0;
      return aTime - bTime;
    });
};

export const selectTournamentFixturesByStatus = (
  state: RootState,
  tournamentId: string,
  status: TournamentFixtureEntity['status'],
) => selectTournamentFixtures(state, tournamentId).filter(f => f.status === status);

export type PointsTableFormLetter = 'W' | 'L' | 'T' | 'NR';

export type PointsRow = {
  teamId: string;
  teamName: string;
  /** Short label for table (shortName or compact abbreviation). */
  teamLabel: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
  /** Up to five most recent results, oldest → newest; `null` pads when fewer than five. */
  lastFive: (PointsTableFormLetter | null)[];
};

function abbrevTeamName(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  if (t.length <= 4) return t.toUpperCase();
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
  }
  return t.slice(0, 3).toUpperCase();
}

function outcomeForTeamInFixture(
  fixture: TournamentFixtureEntity,
  teamId: string,
  match: MatchSetup | undefined,
): PointsTableFormLetter | null {
  const aId = fixture.teamAId;
  const bId = fixture.teamBId;
  if (teamId !== aId && teamId !== bId) return null;
  if (aId === TOURNAMENT_BYE_TEAM_ID || bId === TOURNAMENT_BYE_TEAM_ID) return null;
  const isA = teamId === aId;

  if (fixture.manualOutcome && !fixture.matchId) {
    if (fixture.manualOutcome === 'tie') return 'T';
    if (fixture.manualOutcome === 'teamA') return isA ? 'W' : 'L';
    return isA ? 'L' : 'W';
  }

  if (fixture.status === 'abandoned') return 'T';

  if (fixture.status === 'no_result' && !fixture.matchId) return 'NR';

  if (!fixture.matchId) return null;

  if (!match) return 'NR';

  if (match.resultReason === 'TIE') return 'T';

  if (
    fixture.status === 'no_result' ||
    match.resultReason === 'NO_RESULT' ||
    match.winnerTeam == null
  ) {
    return 'NR';
  }

  if (match.winnerTeam === 'teamA') return isA ? 'W' : 'L';
  return isA ? 'L' : 'W';
}

const ballsToOversFloat = (balls: number) => (balls <= 0 ? 0 : balls / 6);

function computeResultSummary(m: MatchSetup) {
  if (!m.isCompleted) return 'No result';
  if (m.resultReason === 'TIE') return 'Match tied';
  if (!m.winnerTeam) return 'No result';
  const winnerName =
    m.winnerTeam === 'teamA' ? m.teamA?.name ?? '' : m.teamB?.name ?? '';
  return winnerName ? `${winnerName} won` : 'Result saved';
}

export const selectTournamentPointsTable = (state: RootState, tournamentId: string) => {
  const tournament = selectTournamentById(state, tournamentId);
  if (!tournament) return [];

  const teams = selectTournamentTeams(state, tournamentId);
  const scoredOrDecidedFixtures = selectTournamentFixtures(state, tournamentId).filter(
    f =>
      f.stage !== 'KNOCKOUT' &&
      (f.stage == null || f.stage === 'GROUP') &&
      ['completed', 'no_result', 'abandoned'].includes(f.status) &&
      (!!f.matchId ||
        (f.status === 'completed' && !!f.manualOutcome) ||
        f.status === 'abandoned'),
  );

  type RowAcc = Omit<PointsRow, 'lastFive'> & {
    runsFor: number;
    ballsFaced: number;
    runsAgainst: number;
    ballsBowled: number;
  };

  const rowsByTeam: Record<string, RowAcc> = {};

  teams.forEach(team => {
    rowsByTeam[team.id] = {
      teamId: team.id,
      teamName: team.name,
      teamLabel: (team.shortName && team.shortName.trim()) || abbrevTeamName(team.name),
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      nrr: 0,
      runsFor: 0,
      ballsFaced: 0,
      runsAgainst: 0,
      ballsBowled: 0,
    };
  });

  const pts = tournament.settings?.pointsSystem ?? { win: 2, tie: 1, loss: 0, noResult: 1 };

  scoredOrDecidedFixtures.forEach(fixture => {
    if (fixture.manualOutcome && !fixture.matchId) {
      applyManualOutcomeToRows(fixture, rowsByTeam, pts);
      return;
    }

    const aId = fixture.teamAId;
    const bId = fixture.teamBId;
    if (!aId || !bId) return;

    const aRow = rowsByTeam[aId];
    const bRow = rowsByTeam[bId];
    if (!aRow || !bRow) return;

    if (fixture.status === 'abandoned') {
      aRow.played += 1;
      bRow.played += 1;
      aRow.tied += 1;
      bRow.tied += 1;
      aRow.points += pts.tie ?? 1;
      bRow.points += pts.tie ?? 1;
      return;
    }

    const match = (state.match.history ?? []).find(m => m.matchId === fixture.matchId) as
      | MatchSetup
      | undefined;
    if (!match) {
      // Still count match as played/no-result if we have a decided fixture but no saved match payload.
      aRow.played += 1;
      bRow.played += 1;
      aRow.noResult += 1;
      bRow.noResult += 1;
      aRow.points += pts.noResult ?? 1;
      bRow.points += pts.noResult ?? 1;
      return;
    }

    aRow.played += 1;
    bRow.played += 1;

    // Runs/balls (NRR) from innings totals
    const i1 = match.innings1;
    const i2 = match.innings2;
    if (i1 && i2) {
      const teamAInnings = i1.battingTeam === 'teamA' ? i1 : i2;
      const teamBInnings = i1.battingTeam === 'teamB' ? i1 : i2;

      aRow.runsFor += teamAInnings.totalRuns ?? 0;
      aRow.ballsFaced += teamAInnings.totalBalls ?? 0;
      aRow.runsAgainst += teamBInnings.totalRuns ?? 0;
      aRow.ballsBowled += teamBInnings.totalBalls ?? 0;

      bRow.runsFor += teamBInnings.totalRuns ?? 0;
      bRow.ballsFaced += teamBInnings.totalBalls ?? 0;
      bRow.runsAgainst += teamAInnings.totalRuns ?? 0;
      bRow.ballsBowled += teamAInnings.totalBalls ?? 0;
    }

    if (match.resultReason === 'TIE') {
      aRow.tied += 1;
      bRow.tied += 1;
      aRow.points += pts.tie ?? 1;
      bRow.points += pts.tie ?? 1;
      return;
    }

    if (
      fixture.status === 'no_result' ||
      match.resultReason === 'NO_RESULT' ||
      match.winnerTeam == null
    ) {
      aRow.noResult += 1;
      bRow.noResult += 1;
      aRow.points += pts.noResult ?? 1;
      bRow.points += pts.noResult ?? 1;
      return;
    }

    const winner = match.winnerTeam;
    if (winner === 'teamA') {
      aRow.won += 1;
      bRow.lost += 1;
      aRow.points += pts.win ?? 2;
      bRow.points += pts.loss ?? 0;
    } else {
      bRow.won += 1;
      aRow.lost += 1;
      bRow.points += pts.win ?? 2;
      aRow.points += pts.loss ?? 0;
    }
  });

  const computed: Omit<PointsRow, 'lastFive'>[] = Object.values(rowsByTeam).map(r => {
    const forOvers = ballsToOversFloat(r.ballsFaced);
    const againstOvers = ballsToOversFloat(r.ballsBowled);
    const nrr =
      forOvers > 0 && againstOvers > 0
        ? r.runsFor / forOvers - r.runsAgainst / againstOvers
        : 0;
    return {
      teamId: r.teamId,
      teamName: r.teamName,
      teamLabel: r.teamLabel,
      played: r.played,
      won: r.won,
      lost: r.lost,
      tied: r.tied,
      noResult: r.noResult,
      points: r.points,
      nrr: Number.isFinite(nrr) ? Number(nrr.toFixed(3)) : 0,
    };
  });

  computed.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  const outcomesByTeam: Record<string, PointsTableFormLetter[]> = {};
  teams.forEach(t => {
    outcomesByTeam[t.id] = [];
  });

  const chrono = [...scoredOrDecidedFixtures].sort((a, b) => {
    const at =
      a.scheduledAt && dayjs(a.scheduledAt).isValid() ? dayjs(a.scheduledAt).valueOf() : 0;
    const bt =
      b.scheduledAt && dayjs(b.scheduledAt).isValid() ? dayjs(b.scheduledAt).valueOf() : 0;
    if (at !== bt) return at - bt;
    return a.id.localeCompare(b.id);
  });

  chrono.forEach(f => {
    const match = f.matchId
      ? ((state.match.history ?? []).find(m => m.matchId === f.matchId) as MatchSetup | undefined)
      : undefined;
    [f.teamAId, f.teamBId].forEach(tid => {
      if (!tid || !outcomesByTeam[tid]) return;
      const letter = outcomeForTeamInFixture(f, tid, match);
      if (letter) outcomesByTeam[tid].push(letter);
    });
  });

  const paddedLastFive = (teamId: string): (PointsTableFormLetter | null)[] => {
    const seq = outcomesByTeam[teamId] ?? [];
    const last = seq.slice(-5);
    const pad = Math.max(0, 5 - last.length);
    return [...Array(pad).fill(null), ...last] as (PointsTableFormLetter | null)[];
  };

  return computed.map(row => ({
    ...row,
    lastFive: paddedLastFive(row.teamId),
  }));
};

/** Completed tournament matches with saved scorecards (for Stats tab). */
export const selectTournamentStatsSections = (state: RootState, tournamentId: string) => {
  const matches = (state.match.history ?? []).filter(
    m =>
      m.tournamentId === tournamentId &&
      m.isCompleted === true &&
      !!m.teamA?.players &&
      !!m.teamB?.players,
  );
  return computeTournamentStatsSections(matches);
};

export const selectFixtureResultSummary = (state: RootState, fixtureId: string) => {
  const fixture = state.tournament.fixturesById[fixtureId];
  if (!fixture?.matchId) return fixture?.resultSummary ?? null;
  const match = (state.match.history ?? []).find(m => m.matchId === fixture.matchId);
  if (!match) return fixture.resultSummary ?? null;
  return computeResultSummary(match);
};
