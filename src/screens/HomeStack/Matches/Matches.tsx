import { useNavigation } from '@react-navigation/native';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowLg, cardShadowSm } from '../../../utils/cardShadow';
import { live, matches, singlematch } from '../../../assets/images';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import React from 'react';
import ThemeText from '../../../components/ThemeText';
import {
  ActiveMatchesCard,
  MatchHistoryCard,
  MatchRow,
} from '../../../components/MatchDashboard';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { routes } from '../../../utils/routes';
import { useSelector } from 'react-redux';
import { useThemeContext } from '../../../theme/themeContext';
import { RootState } from '../../../features/store/rootReducer';

const Matches = () => {
  const match = useSelector((state: any) => state.match);
  const tournamentsById = useSelector(
    (s: RootState) => s.tournament.tournamentsById,
  );
  const navigation = useNavigation();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'live'>('all');

  const StartMatch = () => {
    navigation.navigate(routes.startMatch as never);
  };

  const openLiveMatch = () => {
    navigation.navigate(routes.matchscoring as never);
  };

  const openHistory = () => {
    navigation.navigate(routes.matchHistory as never);
  };

  const currentMatch = match?.currentMatch;
  const tournamentName = currentMatch?.tournamentId
    ? tournamentsById?.[currentMatch.tournamentId]?.name
    : null;
  // legacy UI removed; keep current match bits only for progress + navigation
  const innings =
    currentMatch?.currentInnings === 2
      ? currentMatch?.innings2
      : currentMatch?.innings1;

  const liveProgressPct =
    currentMatch?.overs && innings?.totalBalls != null
      ? Math.max(
          0,
          Math.min(100, (innings.totalBalls / (currentMatch.overs * 6)) * 100),
        )
      : 0;

  // legacy "last result" section removed (history remains accessible via Match History).

  return (
    <HomeWrapper headerShown={true}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {filterOpen ? (
          <Pressable
            onPress={() => setFilterOpen(false)}
            style={styles.dropdownBackdrop}
          />
        ) : null}

        <Pressable
          onPress={StartMatch}
          style={[
            styles.heroImageCard,
            isDark ? styles.heroShadowDark : styles.heroShadowLight,
          ]}
        >
          <ImageBackground
            source={singlematch}
            resizeMode="cover"
            style={styles.heroImageBg}
            imageStyle={styles.heroImageBgImage}
          >
            <View style={styles.heroImageContent}>
              <ThemeText color="white" style={styles.heroImageTitle}>
                Create{'\n'}Single Match
              </ThemeText>
              <ThemeText color="white" style={styles.heroImageSubtitle}>
                Create a quick match and start scoring in minutes.
              </ThemeText>
              <View style={styles.heroImageCta}>
                <ThemeText color="white" style={styles.heroImageCtaText}>
                  Create match
                </ThemeText>
              </View>
            </View>
          </ImageBackground>
        </Pressable>

        <View
          style={[
            styles.panelCardShell,
            isDark ? styles.heroShadowDark : styles.heroShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ActiveMatchesCard
            title="Active Matches"
            subtitle="Continue where you left off"
            headerIcon={live}
            headerIconTint="#21C16B"
            headerIconBg="#E7F7EE"
            countLabel={`${currentMatch ? 1 : 0} Ongoing`}
            countBg={theme.primaryMuted}
            countFg={theme.primary}
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
            ]}
          >
            {currentMatch &&
            (activeFilter === 'all' || activeFilter === 'live') ? (
              <MatchRow
                title={`${currentMatch?.teamA?.name ?? '-'} vs ${
                  currentMatch?.teamB?.name ?? '-'
                }`}
                subtitle={
                  tournamentName ??
                  (currentMatch?.tournamentId ? 'Tournament' : 'Simple match')
                }
                leftIcon={matches}
                leftIconTint={theme.white}
                statusLabel="Live"
                statusBg="#E7F7EE"
                statusFg="#21C16B"
                progressPct={liveProgressPct}
                progressTrackColor={theme.gray3}
                borderColor={theme.border}
                backgroundColor={theme.surface}
                isDark={isDark}
                onPress={openLiveMatch}
              />
            ) : !currentMatch ? (
              <View style={styles.emptyInline}>
                <ThemeText color="text" style={styles.emptyInlineTitle}>
                  No match in progress
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.emptyInlineSub}>
                  Start a match to score ball-by-ball.
                </ThemeText>
              </View>
            ) : null}

            <Pressable
              onPress={openHistory}
              style={[
                styles.panelButtonRow,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemeText color="primary" style={styles.panelButtonText}>
                View match history
              </ThemeText>
              <ThemeText color="primary" style={styles.panelButtonArrow}>
                →
              </ThemeText>
            </Pressable>
          </ActiveMatchesCard>
        </View>

        <View
          style={[
            styles.historyCardShell,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
          ]}
        >
          <MatchHistoryCard
            title="Match History"
            subtitle="View completed and saved matches"
            iconGlyph="↻"
            iconBg="#F1EAFE"
            iconColor="#6D28D9"
            borderColor={theme.border}
            backgroundColor={theme.surface}
            onPress={openHistory}
          />
        </View>
      </ScrollView>
    </HomeWrapper>
  );
};

export default Matches;

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  heroShadowLight: cardShadowLg(false),
  heroShadowDark: cardShadowLg(true),
  scroll: { flex: 1, width: '100%' },
  content: {
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(32),
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
    zIndex: 40,
  },
  panelCardShell: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    overflow: 'hidden',
    zIndex: 41,
    marginTop: heightPixel(24),
  },
  historyCardShell: {
    marginTop: heightPixel(14),
  },
  panelButtonRow: {
    marginTop: heightPixel(12),
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelButtonText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  panelButtonArrow: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  emptyInline: {
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(4),
  },
  emptyInlineTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  emptyInlineSub: {
    marginTop: heightPixel(4),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
    lineHeight: fontPixel(14),
  },
  heroImageCard: {
    marginTop: 0,
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
    backgroundColor: '#F5B73A',
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
    backgroundColor: '#0B1D3A',
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
  heroIntroCard: {
    marginTop: heightPixel(24),
    borderRadius: widthPixel(20),
    borderWidth: 1,
    padding: widthPixel(18),
  },
  sectionFirst: {
    marginTop: 0,
  },
  heroTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(24),
  },
  heroText: {
    marginTop: heightPixel(8),
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    lineHeight: fontPixel(21),
  },
  primaryCta: {
    marginTop: heightPixel(16),
  },
  primaryCtaText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  section: {
    marginTop: heightPixel(24),
    width: '100%',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: heightPixel(10),
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  liveDot: {
    width: widthPixel(8),
    height: widthPixel(8),
    borderRadius: widthPixel(4),
    marginRight: widthPixel(8),
  },
  liveMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: heightPixel(8),
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(4),
    borderRadius: widthPixel(999),
  },
  liveBadgeText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
  },
  scoreRow: {
    // marginTop: heightPixel(2),
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  bigScore: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(36),
    letterSpacing: -0.5,
  },
  wkts: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(20),
  },
  oversMeta: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(14),
  },
  oversMetaSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
  },
  oversRight: {
    textAlign: 'right',
  },
  tossRow: {
    marginTop: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(10),
  },
  tossLine: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    lineHeight: fontPixel(18),
  },
  continuePill: {
    marginTop: heightPixel(14),
    alignSelf: 'flex-start',
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(10),
    borderRadius: widthPixel(12),
  },
  continuePillInline: {
    alignSelf: 'flex-start',
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(10),
    borderRadius: widthPixel(12),
  },
  continueText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  liveEmptyCard: {
    borderRadius: widthPixel(16),
    borderWidth: 1,
    padding: widthPixel(18),
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  emptyBody: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    marginTop: heightPixel(8),
    lineHeight: fontPixel(20),
  },
  recentHeroCard: {
    borderRadius: widthPixel(20),
    borderWidth: 1,
    padding: widthPixel(18),
  },
  recentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: widthPixel(12),
  },
  recentSubText: {
    marginTop: heightPixel(8),
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
  },
  recentCta: {
    marginTop: heightPixel(14),
  },
  lastResultText: {
    marginTop: heightPixel(8),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
  },
  viewSummaryRowHome: {
    marginTop: heightPixel(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewSummaryTextHome: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(13),
    letterSpacing: 0.3,
  },
  viewSummaryArrowHome: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
});
