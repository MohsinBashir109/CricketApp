import {
  TBD_FIXTURE_SIDE_A,
  TBD_FIXTURE_SIDE_B,
  TOURNAMENT_BYE_TEAM_ID,
} from '../../types/TournamentTypes';
import { buildRoundRobinRounds } from './roundRobinSchedule';
import type { KnockoutRoundCode, TournamentFixtureStage } from '../../types/TournamentTypes';

export type TeamRef = { id: string; name: string };

export type TournamentGroupPlan = {
  id: string;
  name: string;
  teamIds: string[];
};

export type GroupFixturePlan = {
  stage: TournamentFixtureStage;
  groupId: string;
  groupName: string;
  roundNumber: number;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  roundLabel: string;
};

export type KnockoutFixturePlan = {
  stage: 'KNOCKOUT';
  tempKey: string;
  roundIndex: number;
  /** 1-based: 1 = first knockout round. */
  roundNumber: number;
  knockoutRound: KnockoutRoundCode;
  roundName: string;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  teamAPlaceholder: string | null;
  teamBPlaceholder: string | null;
  teamASeed: string | null;
  teamBSeed: string | null;
  advancesWinnerToTempKey: string | null;
  advancesWinnerAs: 'teamA' | 'teamB' | null;
};

export type SchedulePlan = {
  groups: TournamentGroupPlan[];
  groupFixtures: GroupFixturePlan[];
  knockoutFixtures: KnockoutFixturePlan[];
};

export const groupLetterFromIndex = (index: number) =>
  index < 26 ? String.fromCharCode(65 + index) : String(index + 1);

export function splitTeamsIntoGroups(
  teams: TeamRef[],
  numberOfGroups: number,
  groupIdsAndNames?: { id: string; name: string; teamIds: string[] }[],
): TournamentGroupPlan[] {
  if (groupIdsAndNames?.length) {
    return groupIdsAndNames.map(g => ({
      id: g.id,
      name: g.name,
      teamIds: [...g.teamIds],
    }));
  }

  const list = teams.map(t => t.id);
  if (numberOfGroups < 1 || numberOfGroups > list.length) {
    throw new Error('Invalid number of groups for team count.');
  }

  const sizes = Array.from({ length: numberOfGroups }, (_, i) => {
    const base = Math.floor(list.length / numberOfGroups);
    const rem = list.length % numberOfGroups;
    return i < rem ? base + 1 : base;
  });

  const out: TournamentGroupPlan[] = [];
  let offset = 0;
  for (let g = 0; g < numberOfGroups; g += 1) {
    const size = sizes[g];
    out.push({
      id: `plan-group-${g}`,
      name: `Group ${groupLetterFromIndex(g)}`,
      teamIds: list.slice(offset, offset + size),
    });
    offset += size;
  }
  return out;
}

export function generateRoundRobinFixturePlans(
  groupTeamIds: string[],
  groupId: string,
  groupName: string,
): GroupFixturePlan[] {
  const rounds = buildRoundRobinRounds(groupTeamIds);
  const rows: GroupFixturePlan[] = [];
  let matchNo = 0;
  rounds.forEach((pairs, roundIdx) => {
    pairs.forEach((pair, pi) => {
      matchNo += 1;
      rows.push({
        stage: 'GROUP',
        groupId,
        groupName,
        roundNumber: roundIdx + 1,
        matchNumber: matchNo,
        teamAId: pair.home,
        teamBId: pair.away,
        roundLabel: `${groupName} · R${roundIdx + 1} · M${pi + 1}`,
      });
    });
  });
  return rows;
}

function nextPow2(n: number): number {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function knockoutMetaForTeamsAlive(teamsAlive: number, isFinal: boolean): { name: string; code: KnockoutRoundCode } {
  if (isFinal) return { name: 'Final', code: 'F' };
  if (teamsAlive >= 32) return { name: 'Round of 32', code: 'R32' };
  if (teamsAlive === 16) return { name: 'Round of 16', code: 'R16' };
  if (teamsAlive === 8) return { name: 'Quarter Final', code: 'QF' };
  if (teamsAlive === 4) return { name: 'Semi Final', code: 'SF' };
  return { name: 'Knockout', code: 'QF' };
}

export function buildTopTwoCrossGroupPairs(groupLetters: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < groupLetters.length; i += 2) {
    const a = groupLetters[i];
    const b = groupLetters[i + 1];
    if (!b) break;
    pairs.push([`${a}1`, `${b}2`], [`${b}1`, `${a}2`]);
  }
  return pairs;
}

function placeholderFromSeed(seed: string): string {
  const m = seed.match(/^([A-Z]+)(\d+)$/);
  if (!m) return seed;
  return `Group ${m[1]} rank ${m[2]}`;
}

/**
 * Cross pairing when each group sends top 2 and group count is even (WC style).
 */
export function generateKnockoutShellPlans(args: {
  groupCount: number;
  qualifyPerGroup: number;
  groupLetters: string[];
}): KnockoutFixturePlan[] {
  const { groupCount, qualifyPerGroup, groupLetters } = args;
  const n = groupCount * qualifyPerGroup;
  if (n < 2) return [];

  const bracketSize = nextPow2(n);
  const roundsCount = Math.log2(bracketSize);

  let firstRoundPairs: [string | null, string | null][] = [];

  const canCross =
    qualifyPerGroup === 2 &&
    groupCount % 2 === 0 &&
    groupLetters.length === groupCount;

  if (canCross) {
    firstRoundPairs = buildTopTwoCrossGroupPairs(groupLetters);
  } else {
    const seeds: (string | null)[] = groupLetters.flatMap(letter =>
      Array.from({ length: qualifyPerGroup }, (_, i) => `${letter}${i + 1}`),
    );
    while (seeds.length < bracketSize) {
      seeds.push(null);
    }
    for (let i = 0; i < bracketSize / 2; i += 1) {
      firstRoundPairs.push([seeds[i], seeds[bracketSize - 1 - i]]);
    }
  }

  const matchesPerRound: number[] = [];
  for (let r = 0; r < roundsCount; r += 1) {
    matchesPerRound.push(bracketSize / 2 ** (r + 1));
  }

  const rounds: KnockoutFixturePlan[][] = [];
  let globalMatchNo = 0;
  const mkKey = (r: number, m: number) => `ko:${r}:${m}`;

  for (let r = 0; r < roundsCount; r += 1) {
    const mpr = matchesPerRound[r];
    const teamsAlive = bracketSize / 2 ** r;
    const isFinal = r === roundsCount - 1;
    const { name: roundName, code } = knockoutMetaForTeamsAlive(teamsAlive, isFinal);

    const row: KnockoutFixturePlan[] = [];
    for (let m = 0; m < mpr; m += 1) {
      globalMatchNo += 1;
      const tempKey = mkKey(r, m);
      row.push({
        stage: 'KNOCKOUT',
        tempKey,
        roundIndex: r,
        roundNumber: r + 1,
        knockoutRound: code,
        roundName,
        matchNumber: globalMatchNo,
        teamAId: '',
        teamBId: '',
        teamAPlaceholder: null,
        teamBPlaceholder: null,
        teamASeed: null,
        teamBSeed: null,
        advancesWinnerToTempKey: null,
        advancesWinnerAs: null,
      });
    }
    rounds.push(row);
  }

  for (let i = 0; i < firstRoundPairs.length; i += 1) {
    const m = rounds[0][i];
    const [sa, sb] = firstRoundPairs[i];
    const byeA = sa == null;
    const byeB = sb == null;

    if (byeA && byeB) continue;

    if (byeA || byeB) {
      m.teamAId = byeA ? TOURNAMENT_BYE_TEAM_ID : TBD_FIXTURE_SIDE_A;
      m.teamBId = byeB ? TOURNAMENT_BYE_TEAM_ID : TBD_FIXTURE_SIDE_B;
      m.teamAPlaceholder = byeA ? 'Bye' : placeholderFromSeed(sa!);
      m.teamBPlaceholder = byeB ? 'Bye' : placeholderFromSeed(sb!);
      m.teamASeed = byeA ? null : sa;
      m.teamBSeed = byeB ? null : sb;
    } else {
      m.teamAId = TBD_FIXTURE_SIDE_A;
      m.teamBId = TBD_FIXTURE_SIDE_B;
      m.teamAPlaceholder = placeholderFromSeed(sa!);
      m.teamBPlaceholder = placeholderFromSeed(sb!);
      m.teamASeed = sa;
      m.teamBSeed = sb;
    }
  }

  for (let r = 0; r < roundsCount - 1; r += 1) {
    const cur = rounds[r];
    const nxt = rounds[r + 1];
    for (let i = 0; i < cur.length; i += 1) {
      const parent = nxt[Math.floor(i / 2)];
      cur[i].advancesWinnerToTempKey = parent.tempKey;
      cur[i].advancesWinnerAs = i % 2 === 0 ? 'teamA' : 'teamB';
    }
  }

  for (let r = 1; r < roundsCount; r += 1) {
    const cur = rounds[r];
    const prev = rounds[r - 1];
    for (let i = 0; i < cur.length; i += 1) {
      const left = prev[i * 2];
      const right = prev[i * 2 + 1];
      cur[i].teamAId = TBD_FIXTURE_SIDE_A;
      cur[i].teamBId = TBD_FIXTURE_SIDE_B;
      cur[i].teamASeed = null;
      cur[i].teamBSeed = null;
      cur[i].teamAPlaceholder = `Winner · ${left.roundName} · #${i * 2 + 1}`;
      cur[i].teamBPlaceholder = `Winner · ${right.roundName} · #${i * 2 + 2}`;
    }
  }

  return rounds.flat();
}

export type GenerateTournamentScheduleConfig = {
  teams: TeamRef[];
  scheduleFormat: 'OPEN_GROUP' | 'MULTIPLE_GROUPS';
  numberOfGroups: number;
  existingGroups?: { id: string; name: string; teamIds: string[] }[];
  knockoutEnabled: boolean;
  qualifyPerGroup: number;
};

export function generateTournamentSchedulePlan(config: GenerateTournamentScheduleConfig): SchedulePlan {
  const {
    teams,
    scheduleFormat,
    numberOfGroups,
    existingGroups,
    knockoutEnabled,
    qualifyPerGroup,
  } = config;

  const groups =
    scheduleFormat === 'OPEN_GROUP'
      ? splitTeamsIntoGroups(teams, 1, existingGroups)
      : splitTeamsIntoGroups(teams, numberOfGroups, existingGroups);

  const groupFixtures: GroupFixturePlan[] = [];
  groups.forEach(g => {
    groupFixtures.push(...generateRoundRobinFixturePlans(g.teamIds, g.id, g.name));
  });

  let knockoutFixtures: KnockoutFixturePlan[] = [];
  if (knockoutEnabled && qualifyPerGroup > 0) {
    const letters = groups.map((_, i) => groupLetterFromIndex(i));
    knockoutFixtures = generateKnockoutShellPlans({
      groupCount: groups.length,
      qualifyPerGroup,
      groupLetters: letters,
    });
  }

  return { groups, groupFixtures, knockoutFixtures };
}
