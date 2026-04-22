import dayjs from 'dayjs';
import type { Innings, MatchSetup } from '../../../../types/Playertype';
import { ballsToOvers } from '../../../../utils/constants';

export type FixtureListVariant = 'upcoming' | 'live' | 'completed' | 'neutral';

export function findMatchForFixture(
  fixture: { matchId: string | null },
  history: MatchSetup[],
  current: MatchSetup | null,
): MatchSetup | null | undefined {
  if (!fixture.matchId) return undefined;
  const h = history.find(m => m.matchId === fixture.matchId);
  if (h) return h;
  if (current && current.matchId === fixture.matchId) return current;
  return undefined;
}

export function inningsBattingFor(match: MatchSetup, side: 'teamA' | 'teamB'): Innings | null {
  const i1 = match.innings1;
  const i2 = match.innings2;
  if (i1?.battingTeam === side) return i1;
  if (i2?.battingTeam === side) return i2;
  return null;
}

export function scoreLineFromInnings(inn: Innings | null): string {
  if (!inn) return '—';
  const r = inn.totalRuns ?? 0;
  const w = inn.totalWickets ?? 0;
  const b = inn.totalBalls ?? 0;
  if (b === 0 && r === 0 && w === 0 && !inn.isCompleted) return '—';
  const ovs = ballsToOvers(b);
  return `${r}/${w} (${ovs})`;
}

export function shortMatchResult(m: MatchSetup): string {
  if (m.resultReason === 'TIE') return 'Match tied';
  if (m.resultReason === 'NO_RESULT') return 'No result';
  if (!m.winnerTeam) return 'No result';
  const nm = m.winnerTeam === 'teamA' ? m.teamA?.name ?? '' : m.teamB?.name ?? '';
  return nm ? `${nm} won` : 'Result';
}

export function footerCaption(
  fixture: { status: string; resultSummary?: string | null; scheduledAt?: string | null },
  match: MatchSetup | null | undefined,
  variant: FixtureListVariant,
): string {
  const st = fixture.status;
  const v =
    variant === 'neutral'
      ? st === 'live'
        ? 'live'
        : st === 'upcoming'
          ? 'upcoming'
          : 'completed'
      : variant;

  if (v === 'upcoming') {
    if (fixture.scheduledAt && dayjs(fixture.scheduledAt).isValid()) {
      return dayjs(fixture.scheduledAt).format('hh:mm A');
    }
    return 'Start time TBC';
  }
  if (v === 'live') {
    return match ? 'In progress · tap to score' : 'Getting ready · tap to open';
  }
  return fixture.resultSummary ?? (match ? shortMatchResult(match) : 'Result saved');
}

export type DateSection = { key: string; label: string; items: any[] };

export function groupFixturesByDate(
  fixtures: any[],
  order: 'asc' | 'desc',
): DateSection[] {
  const map = new Map<string, any[]>();
  for (const f of fixtures) {
    const k =
      f.scheduledAt && dayjs(f.scheduledAt).isValid()
        ? dayjs(f.scheduledAt).format('YYYY-MM-DD')
        : '_nodate';
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(f);
  }
  const keys = [...map.keys()].filter(k => k !== '_nodate').sort((a, b) =>
    order === 'asc'
      ? dayjs(a).valueOf() - dayjs(b).valueOf()
      : dayjs(b).valueOf() - dayjs(a).valueOf(),
  );
  const sections: DateSection[] = keys.map(k => ({
    key: k,
    label: dayjs(k).format('D MMM'),
    items: map.get(k) ?? [],
  }));
  const nodate = map.get('_nodate');
  if (nodate?.length) {
    sections.push({ key: '_nodate', label: 'Date TBC', items: nodate });
  }
  return sections;
}
