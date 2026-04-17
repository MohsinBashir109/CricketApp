type RoundRobinFixture = {
  teamAId: string;
  teamBId: string;
  roundLabel: string;
  groupId: string | null;
};

function pairsRoundRobin(teamIds: string[]): [string, string][] {
  const ids = teamIds.filter(Boolean);
  const pairs: [string, string][] = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      pairs.push([ids[i], ids[j]]);
    }
  }
  return pairs;
}

export function generateRoundRobinFixtures({
  teamIds,
  groupId = null,
  roundPrefix = 'League',
}: {
  teamIds: string[];
  groupId?: string | null;
  roundPrefix?: string;
}): RoundRobinFixture[] {
  const unique = Array.from(new Set(teamIds));
  const pairs = pairsRoundRobin(unique);
  return pairs.map(([a, b], idx) => ({
    teamAId: a,
    teamBId: b,
    roundLabel: `${roundPrefix} Match ${idx + 1}`,
    groupId,
  }));
}

export function generateKnockoutFixtures({
  teamIds,
  roundPrefix = 'Knockout',
}: {
  teamIds: string[];
  roundPrefix?: string;
}): RoundRobinFixture[] {
  // Minimal single-elimination: pair teams in order; if odd, last team gets a bye (no fixture).
  const unique = Array.from(new Set(teamIds));
  const fixtures: RoundRobinFixture[] = [];
  const pairsCount = Math.floor(unique.length / 2);
  for (let i = 0; i < pairsCount; i += 1) {
    const a = unique[i];
    const b = unique[unique.length - 1 - i];
    fixtures.push({
      teamAId: a,
      teamBId: b,
      roundLabel: `${roundPrefix} Round 1`,
      groupId: null,
    });
  }
  return fixtures;
}

