import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { TabView } from 'react-native-tab-view';
import ThemeText from '../../../../components/ThemeText';
import Button from '../../../../components/themeButton';
import FixturePlannerModal from '../../../../components/Modals/FixturePlannerModal';
import EditFixtureModal from '../../../../components/Modals/EditFixtureModal';
import { cross, fixturecard, setting } from '../../../../assets/images';
import { matches as matchesIcon } from '../../../../assets/images';
import { RootState } from '../../../../features/store/rootReducer';
import {
  selectTournamentFixtures,
  selectTournamentById,
  selectTournamentTeams,
  selectTournamentGroups,
} from '../../../../features/tournament/tournamentSelectors';
import {
  addTournamentFixture,
  applyFixtureSlotPatches,
  completeFixture,
  deleteTournamentFixture,
  generateFullTournamentSchedule,
  generateTournamentFixtures,
  setFixtureLive,
  updateTournamentFixture,
} from '../../../../features/tournament/tournamentSlice';
import { computeKnockoutFillFromGroupStage } from '../../../../features/tournament/tournamentBracketSync';
import { store } from '../../../../features/store/store';
import {
  isTournamentPlaceholderTeamId,
  TOURNAMENT_BYE_TEAM_ID,
} from '../../../../types/TournamentTypes';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import {
  fontPixel,
  heightPixel,
  widthPixel,
} from '../../../../utils/constants';
import { cardShadowSm } from '../../../../utils/cardShadow';
import { getTournamentTabBarTokens } from '../../../../utils/tournamentTabBarTheme';
import { routes as appRoutes } from '../../../../utils/routes';
import dayjs from 'dayjs';
import type { MatchSetup } from '../../../../types/Playertype';
import {
  findMatchForFixture,
  footerCaption,
  groupFixturesByDate,
  type FixtureListVariant,
} from './fixtureCardUtils';

/** Tab list cards: warm in-card surface, slightly lifted for a lighter read. */
const fixtureTabCardBgLight = 'rgba(255, 252, 248, 0.97)';
const fixtureTabCardBgDark = 'rgba(22, 32, 50, 0.42)';

function fixtureSideName(f: any, side: 'A' | 'B', teamsById: Record<string, any>) {
  const id = side === 'A' ? f.teamAId : f.teamBId;
  const ph = side === 'A' ? f.teamAPlaceholder : f.teamBPlaceholder;
  if (id === TOURNAMENT_BYE_TEAM_ID || ph === 'Bye') return 'Bye';
  if (ph && isTournamentPlaceholderTeamId(id)) return ph;
  return teamsById[id]?.name ?? (side === 'A' ? 'Team A' : 'Team B');
}

const ScheduleMatchCard = ({
  f,
  teamsById,
  theme,
  isDark,
  match,
  listVariant,
  onOpenFixture,
  onViewSummary,
  onEditFixture,
  onDeleteFixture,
}: {
  f: any;
  teamsById: Record<string, any>;
  theme: (typeof colors)['light'];
  isDark: boolean;
  match: MatchSetup | null | undefined;
  listVariant: FixtureListVariant;
  onOpenFixture: (id: string) => void;
  onViewSummary?: (id: string) => void;
  onEditFixture: (id: string) => void;
  onDeleteFixture: (id: string) => void;
}) => {
  const na = fixtureSideName(f, 'A', teamsById);
  const nb = fixtureSideName(f, 'B', teamsById);
  const scorable =
    !isTournamentPlaceholderTeamId(f.teamAId) &&
    !isTournamentPlaceholderTeamId(f.teamBId) &&
    f.teamAId !== TOURNAMENT_BYE_TEAM_ID &&
    f.teamBId !== TOURNAMENT_BYE_TEAM_ID;
  const metaParts: string[] = [];
  if (f.overs) metaParts.push(`T${f.overs}`);
  if (f.roundLabel) metaParts.push(f.roundLabel);
  if (f.matchNumber != null) metaParts.push(`${f.matchNumber}`);
  const headerLeft = metaParts.length ? metaParts.join(' · ') : 'Match';
  const headerDate =
    f.scheduledAt && dayjs(f.scheduledAt).isValid()
      ? dayjs(f.scheduledAt).format('D MMM')
      : '—';

  const v: FixtureListVariant =
    listVariant === 'neutral'
      ? f.status === 'live'
        ? 'live'
        : f.status === 'upcoming'
          ? 'upcoming'
          : 'completed'
      : listVariant;

  const caption = footerCaption(f, match, listVariant);
  const canSummary =
    !!onViewSummary &&
    !!f.matchId &&
    ['completed', 'no_result', 'abandoned'].includes(f.status);
  const showHighlightsSlot =
    ['completed', 'no_result', 'abandoned'].includes(f.status) && (canSummary || !!f.resultSummary);

  const statusPill = (() => {
    if (v === 'live') return 'Live';
    if (v === 'upcoming') return 'Upcoming';
    return 'Completed';
  })();

  const pct = (() => {
    if (v === 'completed') return 100;
    if (v === 'upcoming') return 0;
    if (!match) return null;
    const ov = f.overs ?? null;
    if (!ov) return null;
    const inn =
      match.currentInnings === 2 ? match.innings2 ?? null : match.innings1 ?? null;
    const balls = inn?.totalBalls ?? null;
    if (balls == null) return null;
    return Math.max(0, Math.min(100, (balls / (ov * 6)) * 100));
  })();

  const cardBg = isDark ? fixtureTabCardBgDark : fixtureTabCardBgLight;
  const scrim = isDark
    ? 'rgba(0,0,0,0.12)'
    : 'rgba(255, 252, 248, 0.22)';

  return (
    <View
      style={[
        styles.scheduleCard,
        isDark ? styles.cardShadowDark : styles.cardShadowLight,
        { borderColor: theme.border, backgroundColor: cardBg },
        styles.scheduleCardStretch,
      ]}
    >
      <Image
        source={fixturecard}
        style={[
          styles.fixtureCardArt,
          isDark ? styles.fixtureCardArtBlendDark : styles.fixtureCardArtBlendLight,
        ]}
        resizeMode="cover"
      />
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: scrim }]}
        pointerEvents="none"
      />
      <View style={styles.scheduleCardContentLayer}>
      <Pressable onPress={() => onOpenFixture(f.id)} style={styles.scheduleCardMain}>
        <View style={styles.activeRowTop}>
          <View style={[styles.leadingIconWrap, { backgroundColor: theme.primaryMuted }]}>
            <Image source={matchesIcon} style={[styles.leadingIcon, { tintColor: theme.primary }]} />
          </View>

          <View style={styles.activeTextCol}>
            <Text style={[styles.activeTitle, { color: theme.text }]} numberOfLines={1}>
              {na} vs {nb}
            </Text>
            <Text style={[styles.activeSub, { color: theme.secondaryText }]} numberOfLines={1}>
              {headerLeft} · {headerDate}
            </Text>
          </View>

          <View style={styles.activeRightCol}>
            <View style={[styles.statusPill, { backgroundColor: theme.primaryMuted }]}>
              <Text style={[styles.statusPillText, { color: theme.primary }]} numberOfLines={1}>
                {statusPill}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.secondaryText }]}>›</Text>
          </View>
        </View>

        {pct != null ? (
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: theme.gray3 }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: theme.primary, width: `${pct}%` as any },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.secondaryText }]}>
              {Math.round(pct)}%
            </Text>
          </View>
        ) : null}

        {f.status === 'upcoming' ? (
          <View style={styles.liveHintRow}>
            <ThemeText
              color={scorable ? 'primary' : 'secondaryText'}
              style={styles.liveHintText}
              numberOfLines={1}
            >
              {scorable ? 'Press to start the match' : 'Teams TBC — cannot start yet'}
            </ThemeText>
          </View>
        ) : null}

        {v === 'live' ? (
          <View style={styles.liveBadgeWrap}>
            <View style={[styles.liveBadge, { backgroundColor: theme.error }]}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.scheduleFooterRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerCaption, { color: theme.secondaryText }]} numberOfLines={2}>
            {caption}
          </Text>
          {showHighlightsSlot ? (
            <Pressable
              onPress={() => (canSummary ? onViewSummary!(f.id) : onOpenFixture(f.id))}
              style={[styles.highlightsBox, { backgroundColor: theme.background, borderColor: theme.border }]}
            >
              <Text style={[styles.playIcon, { color: theme.text }]}>▶</Text>
              <Text style={[styles.highlightsTime, { color: theme.secondaryText }]}>
                {canSummary ? 'Summary' : 'Details'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.highlightsSpacer} />
          )}
        </View>
      </Pressable>

      {f.status === 'upcoming' ? (
        <View style={styles.scheduleCardActions}>
          <Pressable hitSlop={10} onPress={() => onEditFixture(f.id)} style={styles.iconBtn}>
            <Image source={setting} style={styles.actionIcon} tintColor={theme.icon} />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => onDeleteFixture(f.id)} style={styles.iconBtn}>
            <Image source={cross} style={styles.actionIcon} tintColor={theme.error} />
          </Pressable>
        </View>
      ) : null}
      </View>
    </View>
  );
};

const FixturesList = ({
  fixtures,
  teamsById,
  onOpenFixture,
  onDeleteFixture,
  onEditFixture,
  onStartFixture: _onStartFixture,
  onViewSummary,
  emptyTitle,
  emptyText,
  listVariant = 'neutral' as FixtureListVariant,
  matchHistory = [] as MatchSetup[],
  currentMatch = null as MatchSetup | null,
  dateOrder = 'asc' as 'asc' | 'desc',
}: any) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const [laneWidth, setLaneWidth] = useState(0);
  const horizontalPad = widthPixel(12);
  const cardGap = widthPixel(8);
  const innerWidth = Math.max(0, laneWidth - horizontalPad * 2);
  const twoCol = innerWidth >= 520;
  const cardPixelWidth =
    twoCol && laneWidth > 0 ? (innerWidth - cardGap) / 2 : innerWidth;

  if (fixtures.length === 0) {
    return (
      <View
        style={styles.fixturesListRoot}
        onLayout={e => setLaneWidth(e.nativeEvent.layout.width)}
      >
      <View
        style={[
          styles.empty,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {
            borderColor: theme.border,
            backgroundColor: isDark ? fixtureTabCardBgDark : fixtureTabCardBgLight,
          },
          styles.emptyCardStretch,
        ]}
      >
        <ThemeText color="text" style={styles.emptyTitle}>
          {emptyTitle}
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.emptyText}>
          {emptyText}
        </ThemeText>
      </View>
      </View>
    );
  }

  const sections = groupFixturesByDate(fixtures, dateOrder);

  return (
    <View
      style={styles.fixturesListRoot}
      onLayout={e => setLaneWidth(e.nativeEvent.layout.width)}
    >
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.list, { paddingHorizontal: horizontalPad }]}
    >
      {sections.map(section => (
        <View key={section.key} style={styles.dateSection}>
          <Text style={[styles.dateSectionTitle, { color: theme.text }]}>{section.label}</Text>
          <View
            style={[
              styles.dateCardRow,
              twoCol ? styles.dateCardRowMultiCol : null,
              twoCol ? { gap: cardGap } : null,
            ]}
          >
            {section.items.map((f: any) => (
              <View
                key={f.id}
                style={[
                  styles.fixtureCardWrap,
                  twoCol && laneWidth > 0
                    ? { width: cardPixelWidth }
                    : styles.fixtureCardWrapFull,
                ]}
              >
                <ScheduleMatchCard
                  f={f}
                  teamsById={teamsById}
                  theme={theme}
                  isDark={isDark}
                  match={findMatchForFixture(f, matchHistory, currentMatch)}
                  listVariant={listVariant}
                  onOpenFixture={onOpenFixture}
                  onViewSummary={onViewSummary}
                  onEditFixture={onEditFixture}
                  onDeleteFixture={onDeleteFixture}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
    </View>
  );
};

const TournamentFixturesTab = ({ tournamentId, navigation }: any) => {
  const dispatch = useDispatch();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const tTab = getTournamentTabBarTokens(isDark);

  const fixtures = useSelector((s: RootState) =>
    selectTournamentFixtures(s, tournamentId),
  );
  const tournament = useSelector((s: RootState) =>
    selectTournamentById(s, tournamentId),
  );
  const teams = useSelector((s: RootState) =>
    selectTournamentTeams(s, tournamentId),
  );
  const groups = useSelector((s: RootState) =>
    selectTournamentGroups(s, tournamentId),
  );

  const [outerIndex, setOuterIndex] = useState(0);
  const [innerIndex, setInnerIndex] = useState(0);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);
  const [startFixtureId, setStartFixtureId] = useState<string | null>(null);
  const [outerRoutes] = useState([
    { key: 'full', title: 'Full' },
    { key: 'group', title: 'Groups' },
    { key: 'knockout', title: 'Knockout' },
  ]);
  const [innerRoutes] = useState([
    { key: 'upcoming', title: 'Upcoming' },
    { key: 'live', title: 'Live' },
    { key: 'completed', title: 'Completed' },
  ]);

  const maxQualifiersPerGroup = useMemo(() => {
    if (!groups?.length) return 1;
    const sizes = groups
      .map((g: any) => Number(g?.teamIds?.length ?? 0))
      .filter((n: number) => n > 0);
    if (sizes.length === 0) return 1;
    return Math.max(1, Math.min(...sizes));
  }, [groups]);

  const maxOpenQualifiers = Math.max(1, teams.length);

  const minGroupSize = useMemo(() => {
    if (!groups?.length) return 0;
    const sizes = groups
      .map((g: any) => Number(g?.teamIds?.length ?? 0))
      .filter((n: number) => n > 0);
    if (sizes.length === 0) return 0;
    return Math.min(...sizes);
  }, [groups]);

  const groupFixtures = useMemo(
    () =>
      fixtures.filter(
        (f: any) =>
          f.stage !== 'KNOCKOUT' && (f.stage == null || f.stage === 'GROUP'),
      ),
    [fixtures],
  );
  const knockoutFixtures = useMemo(
    () => fixtures.filter((f: any) => f.stage === 'KNOCKOUT'),
    [fixtures],
  );
  const fullScheduleSorted = useMemo(() => {
    return [...fixtures].sort((a: any, b: any) => {
      const sa = a.stage === 'KNOCKOUT' ? 1 : 0;
      const sb = b.stage === 'KNOCKOUT' ? 1 : 0;
      if (sa !== sb) return sa - sb;
      const ra = a.roundNumber ?? 0;
      const rb = b.roundNumber ?? 0;
      if (ra !== rb) return ra - rb;
      const ma = a.matchNumber ?? 0;
      const mb = b.matchNumber ?? 0;
      if (ma !== mb) return ma - mb;
      const aTime =
        a.scheduledAt && dayjs(a.scheduledAt).isValid()
          ? dayjs(a.scheduledAt).valueOf()
          : 0;
      const bTime =
        b.scheduledAt && dayjs(b.scheduledAt).isValid()
          ? dayjs(b.scheduledAt).valueOf()
          : 0;
      return aTime - bTime;
    });
  }, [fixtures]);

  const teamsById = useMemo(() => {
    const map: Record<string, any> = {};
    teams.forEach(t => (map[t.id] = t));
    return map;
  }, [teams]);

  /** Hide generate / add once scoring has begun on any fixture or the tournament has finished. */
  const canGenerateOrAddFixtures = useMemo(() => {
    if (!tournament) return false;
    if (tournament.status === 'completed') return false;
    const anyMatchStartedOrDone = fixtures.some(
      (f: any) =>
        !!f.matchId ||
        f.status === 'live' ||
        f.status === 'completed' ||
        f.status === 'no_result' ||
        f.status === 'abandoned',
    );
    return !anyMatchStartedOrDone;
  }, [tournament, fixtures]);

  const matchHistory = useSelector((s: RootState) => s.match.history ?? []);
  const currentMatch = useSelector((s: RootState) => s.match.currentMatch);
  const lastCompletedMatch = useSelector(
    (s: RootState) => s.match.lastCompletedMatch,
  );

  const openFixtureSummary = useCallback(
    (fixtureId: string) => {
      const f = fixtures.find((x: any) => x.id === fixtureId);
      if (!f?.matchId) return;
      let m = matchHistory.find((h: any) => h.matchId === f.matchId) ?? null;
      if (!m && lastCompletedMatch?.matchId === f.matchId) {
        m = lastCompletedMatch;
      }
      if (!m) {
        Alert.alert(
          'Summary unavailable',
          'Open this fixture from match detail, or score the match on this device to keep the full scorecard.',
        );
        return;
      }
      navigation.navigate(appRoutes.matchsummary, { match: m });
    },
    [fixtures, matchHistory, lastCompletedMatch, navigation],
  );

  const upcoming = fullScheduleSorted.filter(
    (f: any) => f.status === 'upcoming',
  );
  const live = fullScheduleSorted.filter((f: any) => f.status === 'live');
  const completed = fullScheduleSorted.filter((f: any) =>
    ['completed', 'no_result', 'abandoned'].includes(f.status),
  );

  const knockoutSorted = useMemo(
    () =>
      [...knockoutFixtures].sort((a: any, b: any) => {
        const ra = a.roundNumber ?? 0;
        const rb = b.roundNumber ?? 0;
        if (ra !== rb) return ra - rb;
        return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
      }),
    [knockoutFixtures],
  );

  const openStartModal = (fixtureId: string) => setStartFixtureId(fixtureId);

  const editingFixture = useMemo(() => {
    if (!editingFixtureId) return null;
    return fixtures.find((f: any) => f.id === editingFixtureId) ?? null;
  }, [editingFixtureId, fixtures]);

  const startFixture = useMemo(() => {
    if (!startFixtureId) return null;
    return fixtures.find((f: any) => f.id === startFixtureId) ?? null;
  }, [startFixtureId, fixtures]);

  const startTeamA = useMemo(() => {
    if (!startFixture) return null;
    return teams.find(t => t.id === startFixture.teamAId) ?? null;
  }, [teams, startFixture]);
  const startTeamB = useMemo(() => {
    if (!startFixture) return null;
    return teams.find(t => t.id === startFixture.teamBId) ?? null;
  }, [teams, startFixture]);

  const startScorable =
    !!startFixture &&
    !isTournamentPlaceholderTeamId(startFixture.teamAId) &&
    !isTournamentPlaceholderTeamId(startFixture.teamBId) &&
    startFixture.teamAId !== TOURNAMENT_BYE_TEAM_ID &&
    startFixture.teamBId !== TOURNAMENT_BYE_TEAM_ID;

  const renderInnerScene = ({ route }: any) => {
    switch (route.key) {
      case 'upcoming':
        return (
          <FixturesList
            fixtures={upcoming}
            teamsById={teamsById}
            onOpenFixture={(fixtureId: string) => openStartModal(fixtureId)}
            onEditFixture={(fixtureId: string) => {
              const f = fixtures.find((item: any) => item.id === fixtureId);
              if (!f) return;
              if (f.status !== 'upcoming' || f.matchId) {
                Alert.alert(
                  'Editing locked',
                  'You can only edit before scoring starts.',
                );
                return;
              }
              setEditingFixtureId(fixtureId);
            }}
            onStartFixture={(fixtureId: string) => openStartModal(fixtureId)}
            onDeleteFixture={(fixtureId: string) => {
              const f = fixtures.find(item => item.id === fixtureId);
              if (!f) return;
              Alert.alert(
                'Delete fixture',
                'Remove this fixture from the tournament?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () =>
                      dispatch(
                        deleteTournamentFixture({ tournamentId, fixtureId }),
                      ),
                  },
                ],
              );
            }}
            emptyTitle="No upcoming matches"
            emptyText="Add fixtures to start scoring. Upcoming matches appear here until scoring begins."
            listVariant="upcoming"
            dateOrder="asc"
            matchHistory={matchHistory}
            currentMatch={currentMatch}
          />
        );
      case 'live':
        return (
          <FixturesList
            fixtures={live}
            teamsById={teamsById}
            onOpenFixture={(fixtureId: string) => openStartModal(fixtureId)}
            onEditFixture={() => {}}
            onStartFixture={() => {}}
            onDeleteFixture={() => {}}
            emptyTitle="No live matches"
            emptyText="When scoring starts, the match moves here and updates ball-by-ball."
            listVariant="live"
            dateOrder="asc"
            matchHistory={matchHistory}
            currentMatch={currentMatch}
          />
        );
      case 'completed':
        return (
          <FixturesList
            fixtures={completed}
            teamsById={teamsById}
            onOpenFixture={(fixtureId: string) => openStartModal(fixtureId)}
            onViewSummary={openFixtureSummary}
            onEditFixture={() => {}}
            onStartFixture={() => {}}
            onDeleteFixture={() => {}}
            emptyTitle="No completed matches"
            emptyText="After a match is finished and the result is saved, it will move here."
            listVariant="completed"
            dateOrder="desc"
            matchHistory={matchHistory}
            currentMatch={currentMatch}
          />
        );
      default:
        return null;
    }
  };

  const renderInnerTabBar = ({ navigationState, jumpTo }: any) => (
    <View
      style={[
        styles.innerTabBar,
        { borderBottomColor: tTab.tabBarFrameBorder },
      ]}
    >
      {navigationState.routes.map((r: any, idx: number) => {
        const active = navigationState.index === idx;
        return (
          <Pressable
            key={r.key}
            onPress={() => jumpTo(r.key)}
            style={[
              styles.innerTabItem,
              active && { borderBottomColor: tTab.tabBarActiveGold },
            ]}
          >
            <Text
              style={[
                styles.innerTabLabel,
                active && styles.innerTabLabelActive,
                { color: active ? tTab.tabBarActiveGold : tTab.tabBarInactive },
              ]}
              numberOfLines={1}
            >
              {r.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderOuterTabBar = ({ navigationState, jumpTo }: any) => (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: tTab.tabBarSurface,
          borderColor: tTab.tabBarFrameBorder,
        },
      ]}
    >
      {navigationState.routes.map((r: any, idx: number) => {
        const active = navigationState.index === idx;
        return (
          <Pressable
            key={r.key}
            onPress={() => jumpTo(r.key)}
            style={[
              styles.tabItem,
              active && { backgroundColor: tTab.tabBarActivePill },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: active ? tTab.tabBarActiveGold : tTab.tabBarInactive },
              ]}
              numberOfLines={1}
            >
              {r.title}
            </Text>
            {active ? (
              <View
                style={[
                  styles.tournamentTabBarUnderline,
                  { backgroundColor: tTab.tabBarActiveGold },
                ]}
              />
            ) : (
              <View style={styles.tournamentTabBarUnderlineShim} />
            )}
          </Pressable>
        );
      })}
    </View>
  );

  const renderOuterScene = ({ route }: any) => {
    if (route.key === 'full') {
      return (
        <View style={styles.fullPane}>
          <TabView
            navigationState={{ index: innerIndex, routes: innerRoutes }}
            renderScene={renderInnerScene}
            onIndexChange={setInnerIndex}
            renderTabBar={renderInnerTabBar}
          />
        </View>
      );
    }
    if (route.key === 'group') {
      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: heightPixel(18) }}
        >
          {groups.map((g: any) => (
            <View key={g.id} style={{ marginBottom: heightPixel(14) }}>
              <ThemeText color="text" style={styles.groupHeading}>
                {g.name}
              </ThemeText>
              <FixturesList
                fixtures={groupFixtures.filter((f: any) => f.groupId === g.id)}
                teamsById={teamsById}
                onOpenFixture={openStartModal}
                onEditFixture={(fixtureId: string) => {
                  const f = fixtures.find((item: any) => item.id === fixtureId);
                  if (!f) return;
                  if (f.status !== 'upcoming' || f.matchId) {
                    Alert.alert(
                      'Editing locked',
                      'You can only edit before scoring starts.',
                    );
                    return;
                  }
                  setEditingFixtureId(fixtureId);
                }}
                onStartFixture={openStartModal}
                onDeleteFixture={(fixtureId: string) => {
                  const f = fixtures.find(item => item.id === fixtureId);
                  if (!f) return;
                  Alert.alert(
                    'Delete fixture',
                    'Remove this fixture from the tournament?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () =>
                          dispatch(
                            deleteTournamentFixture({
                              tournamentId,
                              fixtureId,
                            }),
                          ),
                      },
                    ],
                  );
                }}
                onViewSummary={openFixtureSummary}
                emptyTitle="No group fixtures"
                emptyText="Generate fixtures to see this group's schedule."
                listVariant="neutral"
                dateOrder="asc"
                matchHistory={matchHistory}
                currentMatch={currentMatch}
              />
            </View>
          ))}
        </ScrollView>
      );
    }
    return (
      <FixturesList
        fixtures={knockoutSorted}
        teamsById={teamsById}
        onOpenFixture={openStartModal}
        onEditFixture={() => {}}
        onStartFixture={() => {}}
        onDeleteFixture={() => {}}
        onViewSummary={openFixtureSummary}
        emptyTitle="No knockout fixtures"
        emptyText={
          tournament?.settings?.knockoutEnabled
            ? 'Knockout bracket appears after you generate a full schedule with knockout enabled.'
            : 'Enable knockout when generating fixtures to see knockout rounds.'
        }
        listVariant="neutral"
        dateOrder="asc"
        matchHistory={matchHistory}
        currentMatch={currentMatch}
      />
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <ThemeText color="text" style={styles.headerTitle}>
          Fixtures
        </ThemeText>
        {canGenerateOrAddFixtures ? (
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                if (teams.length < 3) return;
                if (fixtures.length > 0) {
                  Alert.alert(
                    'Regenerate fixtures?',
                    'This will override existing fixtures (and may lose results). Continue only if you want to recreate the tournament from scratch.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Override',
                        style: 'destructive',
                        onPress: () => setPlannerOpen(true),
                      },
                    ],
                  );
                } else {
                  setPlannerOpen(true);
                }
              }}
              style={[styles.smallCta, { backgroundColor: theme.primaryMuted }]}
            >
              <ThemeText color="primary" style={styles.smallCtaText}>
                Generate
              </ThemeText>
            </Pressable>
            <Pressable
              onPress={() => {
                if (teams.length < 3) return;
                const teamAId = teams[0].id;
                const teamBId = teams[1].id;
                dispatch(
                  addTournamentFixture({
                    tournamentId,
                    teamAId,
                    teamBId,
                    overs: 10,
                  }),
                );
              }}
              style={[styles.smallCta, { backgroundColor: theme.primaryMuted }]}
            >
              <ThemeText color="primary" style={styles.smallCtaText}>
                + Add
              </ThemeText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <TabView
        navigationState={{ index: outerIndex, routes: outerRoutes }}
        renderScene={renderOuterScene}
        onIndexChange={setOuterIndex}
        renderTabBar={renderOuterTabBar}
      />

      {fixtures.length === 0 && canGenerateOrAddFixtures ? (
        <View style={styles.bottomCta}>
          <Button
            title="Generate fixtures"
            onPress={() => {
              if (teams.length < 3) return;
              setPlannerOpen(true);
            }}
          />
        </View>
      ) : null}

      {plannerOpen ? (
        <FixturePlannerModal
          visible={plannerOpen}
          existingCount={fixtures.length}
          defaultMode="round_robin"
          defaultDoubleRoundRobin={tournament?.settings?.roundRobinLegs === 2}
          defaultOvers={10}
          defaultStartAtIso={tournament?.createdAt ?? new Date().toISOString()}
          variant="full"
          tournamentFormat={
            tournament?.formatType === 'groupBased' ? 'groupBased' : 'open'
          }
          groupCount={groups.length || 1}
          showQualifiersPerGroup={
            tournament?.formatType === 'groupBased' && minGroupSize >= 4
          }
          showOpenGroupQualifiers={tournament?.formatType === 'open'}
          defaultQualifiersPerGroup={
            tournament?.formatType === 'open'
              ? tournament?.settings?.openGroupQualifiers ??
                tournament?.settings?.qualifiersPerGroup ??
                2
              : minGroupSize >= 4
              ? tournament?.settings?.qualifiersPerGroup ?? 2
              : 1
          }
          maxQualifiersPerGroup={
            tournament?.formatType === 'open'
              ? maxOpenQualifiers
              : maxQualifiersPerGroup
          }
          onClose={() => setPlannerOpen(false)}
          onGenerate={payload => {
            if (payload.scheduleVariant === 'full') {
              const teamNamesById: Record<string, string> = {};
              teams.forEach(t => {
                teamNamesById[t.id] = t.name;
              });
              dispatch(
                generateFullTournamentSchedule({
                  tournamentId,
                  overs: payload.overs,
                  playersPerTeam: payload.playersPerTeam,
                  doubleRoundRobin: payload.doubleRoundRobin,
                  startAtIso: payload.startAtIso,
                  matchesPerDayMode: payload.matchesPerDayMode,
                  matchesPerDay: payload.matchesPerDay,
                  randomMinPerDay: payload.randomMinPerDay,
                  randomMaxPerDay: payload.randomMaxPerDay,
                  allowedWeekdays: payload.allowedWeekdays,
                  qualifiersPerGroup: payload.qualifiersPerGroup,
                  openGroupQualifiers: payload.openGroupQualifiers,
                  knockoutEnabled: payload.knockoutEnabled ?? true,
                  teamNamesById,
                  forceRegenerate: fixtures.length > 0,
                }),
              );
            } else {
              dispatch(
                generateTournamentFixtures({
                  tournamentId,
                  mode: payload.mode,
                  overs: payload.overs,
                  playersPerTeam: payload.playersPerTeam,
                  doubleRoundRobin: payload.doubleRoundRobin,
                  startAtIso: payload.startAtIso,
                  matchesPerDayMode: payload.matchesPerDayMode,
                  matchesPerDay: payload.matchesPerDay,
                  randomMinPerDay: payload.randomMinPerDay,
                  randomMaxPerDay: payload.randomMaxPerDay,
                  allowedWeekdays: payload.allowedWeekdays,
                  qualifiersPerGroup: payload.qualifiersPerGroup,
                }),
              );
            }
          }}
        />
      ) : null}

      <EditFixtureModal
        visible={!!editingFixtureId}
        fixture={editingFixture}
        teams={teams.map(t => ({ id: t.id, name: t.name }))}
        onClose={() => setEditingFixtureId(null)}
        onSave={({
          fixtureId,
          teamAId,
          teamBId,
          scheduledAtIso,
          overs,
          playersPerTeam,
          status,
          resultSummary,
          completeWithoutScoring,
        }) => {
          dispatch(
            updateTournamentFixture({
              tournamentId,
              fixtureId,
              teamAId,
              teamBId,
              scheduledAt: scheduledAtIso,
              overs,
              playersPerTeam,
              status,
              resultSummary,
            }),
          );
          if (completeWithoutScoring) {
            dispatch(
              completeFixture({
                tournamentId,
                fixtureId,
                status: 'completed',
                resultSummary: completeWithoutScoring.resultSummary,
                winnerTeamId: completeWithoutScoring.winnerTeamId,
                manualOutcome: completeWithoutScoring.manualOutcome,
              }),
            );
            const st = store.getState();
            const patches = computeKnockoutFillFromGroupStage(st, tournamentId);
            if (patches.length) {
              dispatch(
                applyFixtureSlotPatches({
                  tournamentId,
                  patches,
                }),
              );
            }
          }
        }}
      />

      <Modal visible={!!startFixtureId} transparent animationType="fade" onRequestClose={() => setStartFixtureId(null)}>
        <View style={styles.startWrap}>
          <Pressable style={styles.startBackdrop} onPress={() => setStartFixtureId(null)} />
          <View
            style={[
              styles.startSheet,
              isDark ? styles.cardShadowDark : styles.cardShadowLight,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ThemeText color="text" style={styles.startTitle}>
              {startFixture?.status === 'live' ? 'Resume scoring' : 'Start scoring'}
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.startBody}>
              {(startTeamA?.name ?? 'Team A') + ' vs ' + (startTeamB?.name ?? 'Team B')}
            </ThemeText>

            {!startScorable && startFixture?.status === 'upcoming' ? (
              <ThemeText color="secondaryText" style={styles.startHint}>
                Teams are not confirmed yet. You can start scoring once both sides are set.
              </ThemeText>
            ) : null}

            {startFixture?.status === 'completed' ||
            startFixture?.status === 'no_result' ||
            startFixture?.status === 'abandoned' ? (
              <Button
                title="View summary"
                onPress={() => {
                  if (startFixtureId) openFixtureSummary(startFixtureId);
                  setStartFixtureId(null);
                }}
              />
            ) : startFixture?.status === 'live' && startFixture?.matchId ? (
              <Button
                title="Resume scoring"
                onPress={() => {
                  setStartFixtureId(null);
                  navigation.navigate(appRoutes.matchscoring);
                }}
              />
            ) : (
              <Button
                title="Start scoring"
                disabled={!startScorable || !startTeamA || !startTeamB}
                onPress={() => {
                  if (!startFixtureId || !startFixture || !startTeamA || !startTeamB) return;
                  const matchId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                  dispatch(setFixtureLive({ tournamentId, fixtureId: startFixtureId, matchId }));
                  setStartFixtureId(null);
                  navigation.navigate(appRoutes.startMatch, {
                    presetMatch: {
                      tournamentId,
                      fixtureId: startFixtureId,
                      matchId,
                      teamA: startTeamA,
                      teamB: startTeamB,
                      overs: startFixture.overs,
                      playersPerTeam: startFixture.playersPerTeam ?? null,
                    },
                  });
                }}
              />
            )}

            <Pressable style={styles.startCancel} onPress={() => setStartFixtureId(null)}>
              <ThemeText color="secondaryText" style={styles.startCancelText}>
                Cancel
              </ThemeText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  root: {
    flex: 1,
    paddingTop: heightPixel(20),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightPixel(8),
  },
  headerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  headerActions: {
    flexDirection: 'row',
    gap: widthPixel(8),
  },
  smallCta: {
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(12),
    borderRadius: widthPixel(12),
  },
  smallCtaText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(3),
    gap: widthPixel(6),
    marginBottom: heightPixel(10),
  },
  tabItem: {
    flex: 1,
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(4),
    borderRadius: widthPixel(10),
    alignItems: 'center',
    minHeight: heightPixel(44),
    borderWidth: 0,
  },
  tabLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
    textTransform: 'capitalize',
  },
  /** Upcoming / Live / Completed: classic underlined row (not the pill + chip style). */
  innerTabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: heightPixel(8),
    minHeight: heightPixel(44),
    marginBottom: heightPixel(10),
  },
  innerTabItem: {
    flex: 1,
    paddingVertical: heightPixel(14),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  innerTabLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  innerTabLabelActive: {
    letterSpacing: 0.4,
  },
  tournamentTabBarUnderline: {
    marginTop: heightPixel(4),
    height: 2,
    width: widthPixel(24),
    borderRadius: widthPixel(999),
  },
  /** Keeps height stable when a tab is inactive (no gold bar). */
  tournamentTabBarUnderlineShim: {
    marginTop: heightPixel(4),
    height: 2,
    width: widthPixel(24),
    opacity: 0,
  },
  list: {
    paddingBottom: heightPixel(18),
    width: '100%',
  },
  fixturesListRoot: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
  },
  fixtureCardWrap: {
    marginBottom: heightPixel(4),
  },
  fixtureCardWrapFull: {
    width: '100%',
    alignSelf: 'stretch',
  },
  scheduleCardStretch: {
    alignSelf: 'stretch',
    minWidth: 0,
  },
  emptyCardStretch: {
    width: '100%',
    alignSelf: 'stretch',
  },
  dateSection: {
    marginBottom: heightPixel(14),
  },
  dateSectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(17),
    marginBottom: heightPixel(10),
  },
  dateCardRow: {
    flexDirection: 'column',
  },
  dateCardRowMultiCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scheduleCard: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    overflow: 'hidden',
    position: 'relative',
  },
  fixtureCardArt: {
    ...StyleSheet.absoluteFillObject,
  },
  fixtureCardArtBlendLight: { opacity: 0.2 },
  fixtureCardArtBlendDark: { opacity: 0.2 },
  scheduleCardContentLayer: {
    position: 'relative',
    zIndex: 1,
  },
  scheduleCardMain: {
    paddingHorizontal: widthPixel(12),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(10),
  },
  activeRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
  },
  leadingIconWrap: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingIcon: {
    width: widthPixel(22),
    height: widthPixel(22),
    resizeMode: 'contain',
  },
  activeTextCol: {
    flex: 1,
    minWidth: 0,
  },
  activeTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  activeSub: {
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(16),
  },
  activeRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: heightPixel(6),
  },
  statusPill: {
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(999),
  },
  statusPillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  chevron: {
    marginTop: heightPixel(-2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(18),
  },
  progressRow: {
    marginTop: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(10),
  },
  progressTrack: {
    flex: 1,
    height: heightPixel(6),
    borderRadius: widthPixel(999),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: widthPixel(999),
  },
  progressText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightPixel(10),
  },
  scheduleMetaLeft: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
    marginRight: widthPixel(8),
  },
  scheduleMetaRight: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  teamScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: heightPixel(6),
  },
  teamNameCell: {
    flex: 1,
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
    paddingRight: widthPixel(8),
  },
  scoreCell: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
    fontVariant: ['tabular-nums'],
  },
  liveHintRow: {
    marginTop: heightPixel(6),
  },
  liveHintText: {
    fontSize: fontPixel(11),
    fontFamily: fontFamilies.semibold,
    lineHeight: fontPixel(16),
  },
  liveBadgeWrap: {
    marginTop: heightPixel(8),
  },
  liveBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: widthPixel(8),
    paddingVertical: heightPixel(3),
    borderRadius: widthPixel(6),
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(10),
    letterSpacing: 0.8,
  },
  scheduleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: heightPixel(10),
    paddingTop: heightPixel(10),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerCaption: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
    lineHeight: fontPixel(16),
    marginRight: widthPixel(8),
  },
  highlightsBox: {
    width: widthPixel(72),
    height: widthPixel(44),
    borderRadius: widthPixel(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  playIcon: {
    fontSize: fontPixel(11),
  },
  highlightsTime: {
    fontSize: fontPixel(10),
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
  },
  highlightsSpacer: {
    width: widthPixel(72),
  },
  scheduleCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: widthPixel(4),
    paddingHorizontal: widthPixel(10),
    paddingBottom: heightPixel(8),
  },
  matchCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
    marginBottom: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: widthPixel(10),
  },
  matchMainCol: {
    flex: 1,
    minWidth: 0,
  },
  matchMain: {
    minWidth: 0,
  },
  viewSummaryRow: {
    marginTop: heightPixel(10),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(4),
    borderRadius: widthPixel(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewSummaryText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(13),
    letterSpacing: 0.3,
  },
  viewSummaryArrow: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  matchTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  matchMeta: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  cardActions: {
    flexDirection: 'row',
    gap: widthPixel(6),
  },
  iconBtn: {
    width: widthPixel(36),
    height: widthPixel(36),
    borderRadius: widthPixel(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionIcon: {
    width: widthPixel(18),
    height: widthPixel(18),
    resizeMode: 'contain',
  },
  readyRow: {
    marginTop: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(10),
  },
  readyText: {
    flex: 1,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    fontFamily: fontFamilies.semibold,
  },
  empty: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(16),
  },
  emptyTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  emptyText: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  groupHeading: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
    marginBottom: heightPixel(8),
  },
  fullPane: {
    flex: 1,
  },
  bottomCta: {
    paddingHorizontal: widthPixel(12),
    paddingTop: heightPixel(10),
    paddingBottom: heightPixel(14),
  },
  startWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: widthPixel(16),
  },
  startBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  startSheet: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(18),
  },
  startTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
    marginBottom: heightPixel(6),
  },
  startBody: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
    marginBottom: heightPixel(10),
    fontFamily: fontFamilies.medium,
  },
  startHint: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(10),
  },
  startCancel: {
    alignSelf: 'center',
    marginTop: heightPixel(10),
    paddingVertical: heightPixel(8),
  },
  startCancelText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});

export default TournamentFixturesTab;
