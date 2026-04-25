import type { MatchSetup, Team } from '../types/Playertype';

/** Both squads often used ids 1..n; scoring needs globally unique numeric ids. */
const PLAYER_ID_BLOCK = 1_000_000;

export function withGloballyUniquePlayerIds(m: MatchSetup): MatchSetup {
  const remap = (team: Team | null, blockIndex: 0 | 1): Team | null => {
    if (!team) return team;
    const base = PLAYER_ID_BLOCK * (blockIndex + 1);
    return {
      ...team,
      players: (team.players ?? []).map((p, i) => ({ ...p, id: base + i })),
    };
  };
  return {
    ...m,
    teamA: remap(m.teamA, 0),
    teamB: remap(m.teamB, 1),
  };
}
