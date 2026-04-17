import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { TabView } from 'react-native-tab-view';
import ThemeText from '../../../../components/ThemeText';
import Button from '../../../../components/themeButton';
import FixturePlannerModal from '../../../../components/Modals/FixturePlannerModal';
import EditFixtureModal from '../../../../components/Modals/EditFixtureModal';
import { cross } from '../../../../assets/images';
import { setting } from '../../../../assets/images';
import { RootState } from '../../../../features/store/rootReducer';
import {
  selectTournamentFixtures,
  selectTournamentById,
  selectTournamentTeams,
  selectTournamentGroups,
} from '../../../../features/tournament/tournamentSelectors';
import {
  addTournamentFixture,
  deleteTournamentFixture,
  generateTournamentFixtures,
  updateTournamentFixture,
} from '../../../../features/tournament/tournamentSlice';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../../utils/constants';
import { routes as appRoutes } from '../../../../utils/routes';
import dayjs from 'dayjs';

const FixturesList = ({
  fixtures,
  teamsById,
  onOpenFixture,
  onDeleteFixture,
  onEditFixture,
  onStartFixture: _onStartFixture,
  emptyTitle,
  emptyText,
}: any) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const isMatchDayOrPast = (iso: string) => {
    const d = dayjs(iso);
    if (!d.isValid()) return false;
    const a = d.startOf('day').valueOf();
    const b = dayjs().startOf('day').valueOf();
    return a <= b;
  };

  if (fixtures.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <ThemeText color="text" style={styles.emptyTitle}>
          {emptyTitle}
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.emptyText}>
          {emptyText}
        </ThemeText>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
      {fixtures.map((f: any) => (
        <View
          key={f.id}
          style={[
            styles.matchCard,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          <Pressable onPress={() => onOpenFixture(f.id)} style={styles.matchMain}>
            <ThemeText color="text" style={styles.matchTitle}>
              {teamsById[f.teamAId]?.name ?? 'Team A'} vs{' '}
              {teamsById[f.teamBId]?.name ?? 'Team B'}
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.matchMeta}>
              {f.roundLabel ? `${f.roundLabel} · ` : ''}
              {f.overs ? `T${f.overs}` : 'Overs TBD'} · {f.status.replace('_', ' ')}
            </ThemeText>
          {f.scheduledAt ? (
            <ThemeText color="secondaryText" style={styles.matchMeta}>
              {dayjs(f.scheduledAt).isValid()
                ? dayjs(f.scheduledAt).format('DD MMM YYYY, hh:mm A')
                : ''}
            </ThemeText>
          ) : null}
            {f.status === 'upcoming' && f.scheduledAt && isMatchDayOrPast(f.scheduledAt) ? (
              <View style={styles.readyRow}>
                <ThemeText color="primary" style={styles.readyText} numberOfLines={1}>
                  Match day is here — start scoring
                </ThemeText>
              </View>
            ) : null}
            {f.resultSummary ? (
              <ThemeText color="secondaryText" style={styles.matchMeta}>
                {f.resultSummary}
              </ThemeText>
            ) : null}
          </Pressable>

          {f.status === 'upcoming' ? (
            <View style={styles.cardActions}>
              <Pressable
                hitSlop={10}
                onPress={() => onEditFixture(f.id)}
                style={styles.iconBtn}
              >
                <Image source={setting} style={styles.actionIcon} tintColor={theme.icon} />
              </Pressable>
              <Pressable
                hitSlop={10}
                onPress={() => onDeleteFixture(f.id)}
                style={styles.iconBtn}
              >
                <Image source={cross} style={styles.actionIcon} tintColor={theme.error} />
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
};

const TournamentFixturesTab = ({ tournamentId, navigation }: any) => {
  const dispatch = useDispatch();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const fixtures = useSelector((s: RootState) => selectTournamentFixtures(s, tournamentId));
  const tournament = useSelector((s: RootState) => selectTournamentById(s, tournamentId));
  const teams = useSelector((s: RootState) => selectTournamentTeams(s, tournamentId));
  const groups = useSelector((s: RootState) => selectTournamentGroups(s, tournamentId));

  const maxQualifiersPerGroup = useMemo(() => {
    if (!groups?.length) return 1;
    const sizes = groups.map((g: any) => Number(g?.teamIds?.length ?? 0)).filter((n: number) => n > 0);
    if (sizes.length === 0) return 1;
    return Math.max(1, Math.min(...sizes));
  }, [groups]);

  const teamsById = useMemo(() => {
    const map: Record<string, any> = {};
    teams.forEach(t => (map[t.id] = t));
    return map;
  }, [teams]);

  const upcoming = fixtures.filter((f: any) => f.status === 'upcoming');
  const live = fixtures.filter((f: any) => f.status === 'live');
  const completed = fixtures.filter((f: any) =>
    ['completed', 'no_result', 'abandoned'].includes(f.status),
  );

  const [index, setIndex] = useState(0);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);
  const [routes] = useState([
    { key: 'upcoming', title: 'Upcoming' },
    { key: 'live', title: 'Live' },
    { key: 'completed', title: 'Completed' },
  ]);

  const editingFixture = useMemo(() => {
    if (!editingFixtureId) return null;
    return fixtures.find((f: any) => f.id === editingFixtureId) ?? null;
  }, [editingFixtureId, fixtures]);

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case 'upcoming':
        return (
          <FixturesList
            fixtures={upcoming}
            teamsById={teamsById}
            onOpenFixture={(fixtureId: string) =>
              navigation.navigate(appRoutes.tournamentMatchDetail, {
                tournamentId,
                fixtureId,
              })
            }
            onEditFixture={(fixtureId: string) => {
              const f = fixtures.find((item: any) => item.id === fixtureId);
              if (!f) return;
              if (f.status !== 'upcoming' || f.matchId) {
                Alert.alert('Editing locked', 'You can only edit before scoring starts.');
                return;
              }
              setEditingFixtureId(fixtureId);
            }}
            onStartFixture={(fixtureId: string) =>
              navigation.navigate(appRoutes.tournamentMatchDetail, {
                tournamentId,
                fixtureId,
              })
            }
            onDeleteFixture={(fixtureId: string) => {
              const f = fixtures.find(item => item.id === fixtureId);
              if (!f) return;
              Alert.alert('Delete fixture', 'Remove this fixture from the tournament?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () =>
                    dispatch(deleteTournamentFixture({ tournamentId, fixtureId })),
                },
              ]);
            }}
            emptyTitle="No upcoming matches"
            emptyText="Add fixtures to start scoring. Upcoming matches appear here until scoring begins."
          />
        );
      case 'live':
        return (
          <FixturesList
            fixtures={live}
            teamsById={teamsById}
            onOpenFixture={(fixtureId: string) =>
              navigation.navigate(appRoutes.tournamentMatchDetail, {
                tournamentId,
                fixtureId,
              })
            }
            onEditFixture={() => {}}
            onStartFixture={() => {}}
            onDeleteFixture={() => {}}
            emptyTitle="No live matches"
            emptyText="When scoring starts, the match moves here and updates ball-by-ball."
          />
        );
      case 'completed':
        return (
          <FixturesList
            fixtures={completed}
            teamsById={teamsById}
            onOpenFixture={(fixtureId: string) =>
              navigation.navigate(appRoutes.tournamentMatchDetail, {
                tournamentId,
                fixtureId,
              })
            }
            onEditFixture={() => {}}
            onStartFixture={() => {}}
            onDeleteFixture={() => {}}
            emptyTitle="No completed matches"
            emptyText="After a match is finished and the result is saved, it will move here."
          />
        );
      default:
        return null;
    }
  };

  const renderTabBar = ({ navigationState, jumpTo }: any) => (
    <View style={[styles.tabBar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      {navigationState.routes.map((r: any, i: number) => {
        const active = navigationState.index === i;
        return (
          <Pressable
            key={r.key}
            onPress={() => jumpTo(r.key)}
            style={[
              styles.tabItem,
              active && { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
            ]}
          >
            <ThemeText color={active ? 'primary' : 'secondaryText'} style={styles.tabLabel}>
              {r.title}
            </ThemeText>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <ThemeText color="text" style={styles.headerTitle}>
          Fixtures
        </ThemeText>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              if (teams.length < 2) return;
              if (fixtures.length > 0) {
                Alert.alert(
                  'Regenerate fixtures?',
                  'This will override existing fixtures (and may lose results). Continue only if you want to recreate the tournament from scratch.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Override', style: 'destructive', onPress: () => setPlannerOpen(true) },
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
              if (teams.length < 2) return;
              const teamAId = teams[0].id;
              const teamBId = teams[1].id;
              dispatch(addTournamentFixture({ tournamentId, teamAId, teamBId, overs: 10 }));
            }}
            style={[styles.smallCta, { backgroundColor: theme.primaryMuted }]}
          >
            <ThemeText color="primary" style={styles.smallCtaText}>
              + Add
            </ThemeText>
          </Pressable>
        </View>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={renderTabBar}
      />

      {fixtures.length === 0 ? (
        <View style={styles.bottomCta}>
          <Button
            title="Generate fixtures"
            onPress={() => {
              if (teams.length < 2) return;
              setPlannerOpen(true);
            }}
          />
        </View>
      ) : null}

      {plannerOpen ? (
        <FixturePlannerModal
          visible={plannerOpen}
          existingCount={fixtures.length}
          defaultMode={
            tournament?.competitionType === 'cup' || tournament?.settings?.knockoutEnabled
              ? 'knockout'
              : 'round_robin'
          }
          defaultDoubleRoundRobin={tournament?.settings?.roundRobinLegs === 2}
          defaultOvers={10}
          defaultStartAtIso={tournament?.createdAt ?? new Date().toISOString()}
          showQualifiersPerGroup={tournament?.formatType === 'groupBased'}
          defaultQualifiersPerGroup={tournament?.settings?.qualifiersPerGroup ?? 2}
          maxQualifiersPerGroup={maxQualifiersPerGroup}
          onClose={() => setPlannerOpen(false)}
          onGenerate={({
            mode,
            overs,
            doubleRoundRobin,
            startAtIso,
            matchesPerDay,
            matchesPerDayMode,
            randomMinPerDay,
            randomMaxPerDay,
            allowedWeekdays,
            qualifiersPerGroup,
          }) => {
            dispatch(
              generateTournamentFixtures({
                tournamentId,
                mode,
                overs,
                doubleRoundRobin,
                startAtIso,
                matchesPerDay,
                matchesPerDayMode,
                randomMinPerDay,
                randomMaxPerDay,
                allowedWeekdays,
                qualifiersPerGroup,
              } as any),
            );
          }}
        />
      ) : null}

      <EditFixtureModal
        visible={!!editingFixtureId}
        fixture={editingFixture}
        teams={teams.map(t => ({ id: t.id, name: t.name }))}
        onClose={() => setEditingFixtureId(null)}
        onSave={({ fixtureId, teamAId, teamBId, scheduledAtIso, overs, status, resultSummary }) => {
          dispatch(
            updateTournamentFixture({
              tournamentId,
              fixtureId,
              teamAId,
              teamBId,
              scheduledAt: scheduledAtIso,
              overs,
              status,
              resultSummary,
            }),
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    padding: widthPixel(4),
    gap: widthPixel(6),
    marginBottom: heightPixel(10),
  },
  tabItem: {
    flex: 1,
    paddingVertical: heightPixel(10),
    borderRadius: widthPixel(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  list: {
    paddingBottom: heightPixel(18),
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
  matchMain: {
    flex: 1,
    minWidth: 0,
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
  bottomCta: {
    paddingHorizontal: widthPixel(12),
    paddingTop: heightPixel(10),
    paddingBottom: heightPixel(14),
  },
});

export default TournamentFixturesTab;

