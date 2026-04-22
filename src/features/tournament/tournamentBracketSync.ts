import type { RootState } from '../store/rootReducer';
import { isTournamentPlaceholderTeamId } from '../../types/TournamentTypes';
import {
  allGroupFixturesFinished,
  buildKnockoutFirstRoundFillPatches,
  buildSeedToTeamMap,
  getQualifiedTeams,
  type FixtureSlotPatch,
} from './tournamentBracketProgress';

export function computeKnockoutFillFromGroupStage(
  state: RootState,
  tournamentId: string,
): FixtureSlotPatch[] {
  const tournament = state.tournament.tournamentsById[tournamentId];
  if (!tournament) return [];
  if (!tournament.settings?.knockoutEnabled) return [];

  const ids = state.tournament.fixtureIdsByTournamentId[tournamentId] ?? [];
  const fixtures = ids.map(id => state.tournament.fixturesById[id]).filter(Boolean);
  if (!allGroupFixturesFinished(fixtures)) return [];

  const ko = fixtures.filter(f => f.stage === 'KNOCKOUT');
  if (ko.length === 0) return [];

  const r1 = ko.filter(f => f.roundNumber === 1);
  const needsSeedFill = r1.some(f => {
    if (f.teamASeed && isTournamentPlaceholderTeamId(f.teamAId)) return true;
    if (f.teamBSeed && isTournamentPlaceholderTeamId(f.teamBId)) return true;
    return false;
  });
  if (!needsSeedFill) return [];

  const groups = tournament.groupIds
    .map(id => state.tournament.groupsById[id])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  const teamNamesById: Record<string, string> = {};
  tournament.selectedTeamIds.forEach(tid => {
    teamNamesById[tid] = state.teams.byId[tid]?.name ?? 'Team';
  });

  const pts = tournament.settings.pointsSystem ?? {
    win: 2,
    tie: 1,
    loss: 0,
    noResult: 1,
  };

  const qualify =
    tournament.formatType === 'open'
      ? Math.min(
          tournament.settings.openGroupQualifiers ?? tournament.settings.qualifiersPerGroup ?? 2,
          tournament.teamCount,
        )
      : (tournament.settings.qualifiersPerGroup ?? 2);

  const qualified = getQualifiedTeams({
    groups,
    fixtures,
    matchHistory: state.match.history ?? [],
    pointsSystem: pts,
    qualifyPerGroup: qualify,
    teamNamesById,
  });

  const seedMap = buildSeedToTeamMap(qualified);
  return buildKnockoutFirstRoundFillPatches({
    knockoutFixtures: ko,
    seedToTeamId: seedMap,
  });
}
