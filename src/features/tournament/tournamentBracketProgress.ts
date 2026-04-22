import type { MatchSetup } from '../../types/Playertype';
import type { TournamentFixtureEntity, TournamentGroup, TournamentSettings } from '../../types/TournamentTypes';
import { TOURNAMENT_BYE_TEAM_ID } from '../../types/TournamentTypes';
import { groupLetterFromIndex } from './tournamentScheduleGenerator';

export type StandingRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
  runsFor: number;
  ballsFaced: number;
  runsAgainst: number;
  ballsBowled: number;
};

export type QualifiedTeam = {
  teamId: string;
  groupId: string;
  groupName: string;
  rank: number;
  seedLabel: string;
};

const ballsToOversFloat = (balls: number) => (balls <= 0 ? 0 : balls / 6);

type RowAcc = StandingRow;

function initRow(teamId: string, teamName: string): RowAcc {
  return {
    teamId,
    teamName,
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
}

function applyFixtureToRows(
  fixture: TournamentFixtureEntity,
  match: MatchSetup | undefined,
  rowsByTeam: Record<string, RowAcc>,
  pts: NonNullable<TournamentSettings['pointsSystem']>,
) {
  const aId = fixture.teamAId;
  const bId = fixture.teamBId;
  if (!aId || !bId) return;
  if (aId === TOURNAMENT_BYE_TEAM_ID || bId === TOURNAMENT_BYE_TEAM_ID) return;

  const aRow = rowsByTeam[aId];
  const bRow = rowsByTeam[bId];
  if (!aRow || !bRow) return;

  aRow.played += 1;
  bRow.played += 1;

  // Abandoned: shared points like a tie (each team gets `tie`, default 1).
  if (fixture.status === 'abandoned') {
    aRow.tied += 1;
    bRow.tied += 1;
    aRow.points += pts.tie ?? 1;
    bRow.points += pts.tie ?? 1;
    return;
  }

  if (!match) {
    aRow.noResult += 1;
    bRow.noResult += 1;
    aRow.points += pts.noResult ?? 1;
    bRow.points += pts.noResult ?? 1;
    return;
  }

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
}

/** Points only — no runs/balls (manual entry does not affect NRR). */
export function applyManualOutcomeToRows(
  fixture: TournamentFixtureEntity,
  rowsByTeam: Record<string, RowAcc>,
  pts: NonNullable<TournamentSettings['pointsSystem']>,
) {
  const aId = fixture.teamAId;
  const bId = fixture.teamBId;
  if (!aId || !bId) return;
  if (aId === TOURNAMENT_BYE_TEAM_ID || bId === TOURNAMENT_BYE_TEAM_ID) return;
  const mo = fixture.manualOutcome;
  if (!mo) return;

  const aRow = rowsByTeam[aId];
  const bRow = rowsByTeam[bId];
  if (!aRow || !bRow) return;

  aRow.played += 1;
  bRow.played += 1;

  if (mo === 'tie') {
    aRow.tied += 1;
    bRow.tied += 1;
    aRow.points += pts.tie ?? 1;
    bRow.points += pts.tie ?? 1;
    return;
  }
  if (mo === 'teamA') {
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
}

export function calculateGroupStandings(args: {
  groupTeamIds: string[];
  teamNamesById: Record<string, string>;
  groupFixtures: TournamentFixtureEntity[];
  matchHistory: MatchSetup[];
  pointsSystem: NonNullable<TournamentSettings['pointsSystem']>;
}): StandingRow[] {
  const { groupTeamIds, teamNamesById, groupFixtures, matchHistory, pointsSystem } = args;

  const rowsByTeam: Record<string, RowAcc> = {};

  groupTeamIds.forEach(id => {
    rowsByTeam[id] = initRow(id, teamNamesById[id] ?? id);
  });

  const decided = groupFixtures.filter(
    f =>
      f.stage !== 'KNOCKOUT' &&
      (f.stage == null || f.stage === 'GROUP') &&
      f.teamAId !== TOURNAMENT_BYE_TEAM_ID &&
      f.teamBId !== TOURNAMENT_BYE_TEAM_ID &&
      ['completed', 'no_result', 'abandoned'].includes(f.status) &&
      (!!f.matchId ||
        (f.status === 'completed' && !!f.manualOutcome) ||
        f.status === 'abandoned'),
  );

  decided.forEach(fixture => {
    if (fixture.manualOutcome && !fixture.matchId) {
      applyManualOutcomeToRows(fixture, rowsByTeam, pointsSystem);
      return;
    }
    const match = matchHistory.find(m => m.matchId === fixture.matchId);
    applyFixtureToRows(fixture, match, rowsByTeam, pointsSystem);
  });

  groupFixtures.forEach(fixture => {
    if (fixture.teamAId !== TOURNAMENT_BYE_TEAM_ID && fixture.teamBId !== TOURNAMENT_BYE_TEAM_ID) {
      return;
    }
    if (!['completed', 'no_result', 'abandoned', 'cancelled'].includes(fixture.status)) return;
    const realId =
      fixture.teamAId === TOURNAMENT_BYE_TEAM_ID ? fixture.teamBId : fixture.teamAId;
    if (!realId || realId === TOURNAMENT_BYE_TEAM_ID) return;
    const row = rowsByTeam[realId];
    if (!row) return;
    row.played += 1;
    row.won += 1;
    row.points += pointsSystem.win ?? 2;
  });

  const out: StandingRow[] = Object.values(rowsByTeam).map(r => {
    const forOvers = ballsToOversFloat(r.ballsFaced);
    const againstOvers = ballsToOversFloat(r.ballsBowled);
    const nrr =
      forOvers > 0 && againstOvers > 0
        ? r.runsFor / forOvers - r.runsAgainst / againstOvers
        : 0;
    return {
      teamId: r.teamId,
      teamName: r.teamName,
      played: r.played,
      won: r.won,
      lost: r.lost,
      tied: r.tied,
      noResult: r.noResult,
      points: r.points,
      nrr: Number.isFinite(nrr) ? Number(nrr.toFixed(3)) : 0,
      runsFor: r.runsFor,
      ballsFaced: r.ballsFaced,
      runsAgainst: r.runsAgainst,
      ballsBowled: r.ballsBowled,
    };
  });

  out.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.nrr !== a.nrr) return b.nrr - a.nrr;
    if (b.won !== a.won) return b.won - a.won;
    return (a.teamName ?? '').localeCompare(b.teamName ?? '');
  });

  return out;
}

export function getQualifiedTeams(args: {
  groups: TournamentGroup[];
  fixtures: TournamentFixtureEntity[];
  matchHistory: MatchSetup[];
  pointsSystem: NonNullable<TournamentSettings['pointsSystem']>;
  qualifyPerGroup: number;
  teamNamesById: Record<string, string>;
}): QualifiedTeam[] {
  const { groups, fixtures, matchHistory, pointsSystem, qualifyPerGroup, teamNamesById } = args;
  const out: QualifiedTeam[] = [];

  groups.forEach((g, gi) => {
    const letter = groupLetterFromIndex(gi);
    const groupFixtures = fixtures.filter(
      f => f.groupId === g.id && f.stage !== 'KNOCKOUT' && (f.stage == null || f.stage === 'GROUP'),
    );
    const standings = calculateGroupStandings({
      groupTeamIds: g.teamIds,
      teamNamesById,
      groupFixtures,
      matchHistory,
      pointsSystem,
    });

    standings.slice(0, qualifyPerGroup).forEach((row, idx) => {
      out.push({
        teamId: row.teamId,
        groupId: g.id,
        groupName: g.name,
        rank: idx + 1,
        seedLabel: `${letter}${idx + 1}`,
      });
    });
  });

  return out;
}

export function allGroupFixturesFinished(fixtures: TournamentFixtureEntity[]): boolean {
  const groupOnes = fixtures.filter(
    f => f.stage !== 'KNOCKOUT' && (f.stage == null || f.stage === 'GROUP'),
  );
  if (groupOnes.length === 0) return false;
  return groupOnes.every(f =>
    ['completed', 'no_result', 'abandoned', 'cancelled'].includes(f.status),
  );
}

export type FixtureSlotPatch = {
  fixtureId: string;
  teamAId?: string;
  teamBId?: string;
  teamAPlaceholder?: string | null;
  teamBPlaceholder?: string | null;
  teamASeed?: string | null;
  teamBSeed?: string | null;
};

export function buildSeedToTeamMap(qualified: QualifiedTeam[]): Record<string, string> {
  const m: Record<string, string> = {};
  qualified.forEach(q => {
    m[q.seedLabel] = q.teamId;
  });
  return m;
}

export function buildKnockoutFirstRoundFillPatches(args: {
  knockoutFixtures: TournamentFixtureEntity[];
  seedToTeamId: Record<string, string>;
}): FixtureSlotPatch[] {
  const { knockoutFixtures, seedToTeamId } = args;
  const patches: FixtureSlotPatch[] = [];

  const r0 = knockoutFixtures.filter(f => f.stage === 'KNOCKOUT' && f.roundNumber === 1);
  r0.forEach(f => {
    const nextA = f.teamASeed ? seedToTeamId[f.teamASeed] : null;
    const nextB = f.teamBSeed ? seedToTeamId[f.teamBSeed] : null;
    if (!nextA && !nextB) return;

    const patch: FixtureSlotPatch = { fixtureId: f.id };
    if (nextA) {
      patch.teamAId = nextA;
      patch.teamAPlaceholder = null;
      patch.teamASeed = f.teamASeed;
    }
    if (nextB) {
      patch.teamBId = nextB;
      patch.teamBPlaceholder = null;
      patch.teamBSeed = f.teamBSeed;
    }
    patches.push(patch);
  });

  return patches;
}
