import React, { useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../components/ThemeText';
import {
  ActiveTournamentsCard,
  TournamentHistoryCard,
} from '../../../components/TournamentDashboard';
import { selectAllTournaments } from '../../../features/tournament/tournamentSelectors';
import type { RootState } from '../../../features/store/rootReducer';
import { useThemeContext } from '../../../theme/themeContext';
import { ball, live, throphy, tournament } from '../../../assets/images';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowLg } from '../../../utils/cardShadow';
import { routes } from '../../../utils/routes';
import HomeWrapper from '../../../wrappers/HomeWrapper';

const TournamentsHome = ({ navigation }: any) => {
  // Dashboard requirement: show only LIVE tournaments in the preview list.
  const [_activeFilter, setActiveFilter] = useState<
    'all' | 'live' | 'in_progress'
  >('live');
  const [filterOpen, setFilterOpen] = useState(false);
  const tournaments = useSelector(selectAllTournaments);
  const { isDark } = useThemeContext();
  const themeColors = colors[isDark ? 'dark' : 'light'];

  const activeCount = useMemo(
    () => tournaments.filter(t => t.status !== 'completed').length,
    [tournaments],
  );

  const activeTournaments = useMemo(
    () => tournaments.filter(t => t.status !== 'completed'),
    [tournaments],
  );
  const { fixturesById, fixtureIdsByTournamentId } = useSelector(
    (s: RootState) => s.tournament,
  );

  const tournamentProgressById = useMemo(() => {
    const out: Record<
      string,
      { pct: number; hasLive: boolean; total: number; completed: number }
    > = {};
    const completedSet = new Set(['completed', 'no_result', 'abandoned']);
    for (const t of activeTournaments as any[]) {
      const ids: string[] = fixtureIdsByTournamentId?.[t.id] ?? [];
      const total = ids.length;
      let completed = 0;
      let hasLive = false;
      for (const fid of ids) {
        const f = fixturesById?.[fid];
        if (!f) continue;
        if (f.status === 'live') hasLive = true;
        if (completedSet.has(f.status)) completed += 1;
      }
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      out[t.id] = { pct, hasLive, total, completed };
    }
    return out;
  }, [activeTournaments, fixtureIdsByTournamentId, fixturesById]);

  const activeFiltered = useMemo(() => {
    // Force live-only view for this screen section.
    return (activeTournaments as any[]).filter(
      t => tournamentProgressById[t.id]?.hasLive,
    );
  }, [activeTournaments, tournamentProgressById]);

  const activePreview = useMemo(
    () => activeFiltered.slice(0, 1),
    [activeFiltered],
  );

  const ongoingCount = activeFiltered.length;

  return (
    <HomeWrapper headerShown>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {filterOpen ? (
          <Pressable
            onPress={() => setFilterOpen(false)}
            style={styles.dropdownBackdrop}
          />
        ) : null}
        <Pressable
          onPress={() => navigation.navigate(routes.createTournament)}
          style={[
            styles.heroImageCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
          ]}
        >
          <ImageBackground
            source={tournament}
            resizeMode="cover"
            style={styles.heroImageBg}
            imageStyle={styles.heroImageBgImage}
          >
            <View style={styles.heroImageContent}>
              <ThemeText color="white" style={styles.heroImageTitle}>
                Create{'\n'}Tournament
              </ThemeText>
              <ThemeText color="white" style={styles.heroImageSubtitle}>
                Start a new tournament and set up teams,
              </ThemeText>

              <View style={styles.heroImageCta}>
                <ThemeText color="white" style={styles.heroImageCtaText}>
                  New Tournament
                </ThemeText>
              </View>
            </View>
          </ImageBackground>
        </Pressable>

        <View
          style={[
            styles.panelCardShell,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <ActiveTournamentsCard
            title="Active Tournaments"
            subtitle="Continue where you left off"
            headerIcon={live}
            headerIconTint="#21C16B"
            headerIconBg="#E7F7EE"
            countLabel={`${ongoingCount} Ongoing`}
            countBg={themeColors.primaryMuted}
            countFg={themeColors.primary}
            isDark={isDark}
            onPressCount={() => setFilterOpen(v => !v)}
            dropdownOpen={filterOpen}
            dropdownItems={[
              {
                id: 'all',
                label: 'All',
                onPress: () => {
                  setActiveFilter('all');
                  setFilterOpen(false);
                },
              },
              {
                id: 'live',
                label: 'Live',
                onPress: () => {
                  setActiveFilter('live');
                  setFilterOpen(false);
                },
              },
              {
                id: 'in_progress',
                label: 'In progress',
                onPress: () => {
                  setActiveFilter('in_progress');
                  setFilterOpen(false);
                },
              },
            ]}
            rows={activePreview.map((t: any, idx: number) => {
              const prog = tournamentProgressById[t.id] ?? {
                pct: 0,
                hasLive: false,
                total: 0,
                completed: 0,
              };

              const statusPill = prog.hasLive ? 'Live' : 'In Progress';
              const statusBg = prog.hasLive ? '#E7F7EE' : '#E8F0FF';
              const statusFg = prog.hasLive ? '#21C16B' : themeColors.primary;

              const meta =
                t.formatType === 'groupBased'
                  ? 'Group Stage'
                  : t.formatType === 'open'
                  ? 'Open'
                  : 'Tournament';
              const teamsMeta =
                t.teamCount != null ? `${t.teamCount} Teams` : '';
              const leftIcon = idx === 0 ? throphy : ball;
              const leftIconTint = idx === 0 ? '#F5B73A' : themeColors.primary;

              return {
                id: t.id,
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
                artBackground: idx === 0,
                title: t.name ?? 'Tournament',
                subtitle: `${meta} • ${teamsMeta}`.trim(),
                leftIcon,
                leftIconTint,
                statusLabel: statusPill,
                statusBg,
                statusFg,
                progressPct: prog.pct,
                progressTrackColor: themeColors.gray3,
                onPress: () =>
                  navigation.navigate(routes.tournamentDetails, {
                    tournamentId: t.id,
                  }),
              };
            })}
            onPressViewAll={() =>
              navigation.navigate(routes.uncompletedTournaments)
            }
            viewAllDisabled={activeCount === 0}
            viewAllBg={themeColors.background}
            viewAllBorder={themeColors.border}
          />
        </View>

        <View
          style={[
            styles.historyCardShell,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
          ]}
        >
          <TournamentHistoryCard
            title="Tournament History"
            subtitle="View completed and saved tournaments"
            iconGlyph="↻"
            iconBg="rgba(255,255,255,0.92)"
            iconColor="#6D28D9"
            borderColor={themeColors.border}
            onPress={() =>
              navigation.navigate(routes.matchHistory, {
                initialTab: 'tournament',
              })
            }
          />
        </View>
      </ScrollView>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  cardShadowLight: cardShadowLg(false),
  cardShadowDark: cardShadowLg(true),
  content: {
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(32),
    position: 'relative',
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
    zIndex: 40,
  },
  panelCardShell: {
    marginTop: heightPixel(24),
    borderWidth: 1,
    borderRadius: widthPixel(18),
    overflow: 'hidden',
    zIndex: 41,
  },
  historyCardShell: {
    marginTop: heightPixel(14),
  },
  heroImageCard: {
    borderRadius: widthPixel(22),
    overflow: 'hidden',
  },
  heroImageBg: {
    minHeight: heightPixel(170),
    padding: widthPixel(18),
    justifyContent: 'center',
  },
  heroImageBgImage: {
    borderRadius: widthPixel(22),
  },
  heroImageContent: {
    width: '60%',
    maxWidth: widthPixel(260),
    minWidth: 0,
    gap: heightPixel(6),
  },
  heroImageTitle: {
    fontSize: fontPixel(28),
    lineHeight: fontPixel(34),
    fontFamily: fontFamilies.bold,
  },
  heroImageSubtitle: {
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
    opacity: 0.95,
    fontFamily: fontFamilies.medium,
  },
  heroImageCta: {
    marginTop: heightPixel(10),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B3FA6',
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(14),
    borderRadius: widthPixel(10),
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  heroImageCtaIcon: {
    width: widthPixel(30),
    height: widthPixel(30),
    borderRadius: widthPixel(999),
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImageCtaIconText: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
    marginTop: -heightPixel(1),
  },
  heroImageCtaText: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
  heroImageCtaArrow: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.bold,
    marginLeft: widthPixel(4),
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(18),
    marginTop: heightPixel(24),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(12),
  },
  cardTitle: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
  },
  historyText: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(21),
  },
  historyCta: {
    marginTop: heightPixel(12),
  },
  // Tournament dashboard cards now live in reusable components.
  emptyCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(18),
  },
  emptyTitle: {
    fontSize: fontPixel(17),
    fontFamily: fontFamilies.semibold,
  },
  emptyText: {
    marginTop: heightPixel(8),
    lineHeight: fontPixel(20),
    fontSize: fontPixel(14),
  },
  tournamentCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(16),
    marginBottom: heightPixel(12),
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: widthPixel(10),
  },
  tournamentName: {
    flex: 1,
    fontSize: fontPixel(17),
    fontFamily: fontFamilies.semibold,
  },
  badge: {
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
    borderRadius: widthPixel(999),
  },
  badgeText: {
    fontSize: fontPixel(10),
    fontFamily: fontFamilies.bold,
  },
  tournamentMeta: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(13),
  },
});

export default TournamentsHome;
