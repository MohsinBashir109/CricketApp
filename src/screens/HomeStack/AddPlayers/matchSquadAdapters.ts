import { Player, PlayerRole } from '../../../types/Playertype';
import type { SquadPlayer, TeamRoleLabel } from './AddPlayersToTeamScreen';

const LABEL_TO_ROLE: Record<TeamRoleLabel, PlayerRole> = {
  Batsman: 'batsman',
  Bowler: 'bowler',
  'All-Rounder': 'allrounder',
  Wicketkeeper: 'wicketkeeper',
};

const ROLE_TO_LABEL: Record<PlayerRole, TeamRoleLabel> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-Rounder',
  wicketkeeper: 'Wicketkeeper',
};

export function playerRoleToLabel(role?: PlayerRole | null): TeamRoleLabel {
  return ROLE_TO_LABEL[role ?? 'batsman'];
}

export function labelToPlayerRole(label: TeamRoleLabel): PlayerRole {
  return LABEL_TO_ROLE[label];
}

export function matchPlayersToSquad(players: Player[]): SquadPlayer[] {
  return players.map(p => ({
    id: String(p.id),
    name: p.name,
    role: playerRoleToLabel(p.role),
  }));
}

/** Builds match `Player` rows like `AddPlayersModal` (fresh lineup stats). */
export function squadPlayersToMatchPlayers(squad: SquadPlayer[]): Player[] {
  return squad.map((s, i) => ({
    id: i + 1,
    name: s.name,
    role: labelToPlayerRole(s.role),
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    outType: '',
    outByBowlerId: null,
    outByFielderId: null,
    overs: null,
    maidens: null,
    conceded: null,
    wickets: null,
    wides: null,
    noBalls: null,
  }));
}
