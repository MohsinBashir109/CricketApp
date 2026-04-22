import type { Innings, MatchSetup, Player } from '../../types/Playertype';

type TeamKey = 'teamA' | 'teamB';

function battingTeamKey(innings: Innings): TeamKey {
  return innings.battingTeam;
}

function bowlingTeamKey(innings: Innings): TeamKey {
  return innings.bowlingTeam;
}

function normalizeName(value: string) {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

export function isSamePlayer(a: Player | null | undefined, id: number | null | undefined) {
  if (a?.id == null || id == null) return false;
  return Number(a.id) === Number(id);
}

export function canSelectAsBatsman(player: Player, innings: Innings): boolean {
  if (!player) return false;
  if (player.isOut) return false;
  if (player.canBat === false) return false;
  if (player.isSubstitute && player.canBat !== true) return false;
  if (Number(player.id) === Number(innings.strikerId)) return false;
  if (Number(player.id) === Number(innings.nonStrikerId)) return false;
  return true;
}

export function canSelectAsBowler(player: Player, innings: Innings): boolean {
  if (!player) return false;
  if (player.canBowl === false) return false;
  if (player.isSubstitute && player.canBowl !== true) return false;
  // Prevent selecting current batters as bowler.
  if (Number(player.id) === Number(innings.strikerId)) return false;
  if (Number(player.id) === Number(innings.nonStrikerId)) return false;
  return true;
}

export function canSelectAsFielder(player: Player): boolean {
  if (!player) return false;
  if (player.canField === false) return false;
  return true;
}

export function getAvailableBatters(match: MatchSetup, innings: Innings): Player[] {
  const team = match[battingTeamKey(innings)];
  const players = team?.players ?? [];
  return players.filter(p => canSelectAsBatsman(p, innings));
}

export function getAvailableBowlers(match: MatchSetup, innings: Innings): Player[] {
  const team = match[bowlingTeamKey(innings)];
  const players = team?.players ?? [];
  return players.filter(p => canSelectAsBowler(p, innings));
}

export function getAvailableFielders(match: MatchSetup, innings: Innings): Player[] {
  const team = match[bowlingTeamKey(innings)];
  const players = team?.players ?? [];
  return players.filter(p => canSelectAsFielder(p));
}

export function isDuplicateName(players: Player[], candidateName: string, ignoredId?: number) {
  const cand = normalizeName(candidateName).toLowerCase();
  if (!cand) return false;
  return players.some(p => {
    if (ignoredId != null && Number(p.id) === Number(ignoredId)) return false;
    return normalizeName(p.name).toLowerCase() === cand;
  });
}

