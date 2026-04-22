import { TOURNAMENT_BYE_TEAM_ID } from '../../types/TournamentTypes';

export type RoundRobinPair = { home: string; away: string };

/**
 * Berger / circle method: each team plays every other once.
 * Odd team count adds a BYE slot so one team rests each round.
 */
export function buildRoundRobinRounds(teamIds: string[]): RoundRobinPair[][] {
  const unique = Array.from(new Set(teamIds.filter(Boolean)));
  if (unique.length < 2) return [];

  let teams = [...unique];
  const isOdd = teams.length % 2 === 1;
  if (isOdd) {
    teams = [...teams, TOURNAMENT_BYE_TEAM_ID];
  }

  const n = teams.length;
  const rounds = n - 1;
  const half = n / 2;
  const rotation = [...teams];

  const out: RoundRobinPair[][] = [];

  for (let r = 0; r < rounds; r += 1) {
    const pairs: RoundRobinPair[] = [];
    for (let i = 0; i < half; i += 1) {
      const a = rotation[i];
      const b = rotation[n - 1 - i];
      if (a === TOURNAMENT_BYE_TEAM_ID || b === TOURNAMENT_BYE_TEAM_ID) {
        const real = a === TOURNAMENT_BYE_TEAM_ID ? b : a;
        pairs.push({ home: real, away: TOURNAMENT_BYE_TEAM_ID });
      } else {
        pairs.push({ home: a, away: b });
      }
    }
    out.push(pairs);
    const carry = rotation[1];
    for (let i = 1; i < n - 1; i += 1) {
      rotation[i] = rotation[i + 1];
    }
    rotation[n - 1] = carry;
  }

  return out;
}
