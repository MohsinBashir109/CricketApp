import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { matches } from '../../../assets/images';

import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import MatchCard from '../../../components/MatchCard';
import React from 'react';
import ThemeText from '../../../components/ThemeText';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { routes } from '../../../utils/routes';
import { useSelector } from 'react-redux';
import { useThemeContext } from '../../../theme/themeContext';
import { RootState } from '../../../features/store/rootReducer';

const ballsToOvers = (balls: number) =>
  `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;

const Matches = () => {
  const match = useSelector((state: any) => state.match);
  const tournamentsById = useSelector((s: RootState) => s.tournament.tournamentsById);
  const navigation = useNavigation();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const StartMatch = () => {
    navigation.navigate(routes.startMatch as never);
  };

  const openLiveMatch = () => {
    navigation.navigate(routes.matchscoring as never);
  };

  const openHistory = () => {
    navigation.navigate(routes.matchHistory as never);
  };

  const tossWinnerKey = match?.currentMatch?.tossWinner;
  const currentMatch = match?.currentMatch;
  const tournamentName =
    currentMatch?.tournamentId ? tournamentsById?.[currentMatch.tournamentId]?.name : null;
  const tossWinnerName =
    tossWinnerKey === 'teamA'
      ? currentMatch?.teamA?.name
      : tossWinnerKey === 'teamB'
      ? currentMatch?.teamB?.name
      : '';
  const innings =
    currentMatch?.currentInnings === 2
      ? currentMatch?.innings2
      : currentMatch?.innings1;

  return (
    <HomeWrapper headerShown={true}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={[styles.section, styles.sectionFirst]}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
            <ThemeText style={styles.sectionTitle} color="text">
              Live match
            </ThemeText>
          </View>

          {currentMatch !== null ? (
            <MatchCard
              teamAName={currentMatch?.teamA?.name}
              teamBName={currentMatch?.teamB?.name}
              onPress={openLiveMatch}
              matchTypeLabel={
                tournamentName ?? (currentMatch?.tournamentId ? 'Tournament' : 'Simple match')
              }
            >
              <View style={styles.liveMetaRow}>
                {/* kept row for spacing; overs moved beside score */}
              </View>

              {innings && (
                <View style={styles.scoreRow}>
                  <ThemeText style={styles.bigScore} color="primary">
                    {innings.totalRuns}
                    <ThemeText style={styles.wkts} color="secondaryText">
                      {' '}
                      / {innings.totalWickets}
                    </ThemeText>
                  </ThemeText>
                  <ThemeText
                    style={[styles.oversMetaSmall, styles.oversRight]}
                    color="desText"
                  >
                    {ballsToOvers(innings.totalBalls)} / T{currentMatch?.overs}{' '}
                    overs
                  </ThemeText>
                </View>
              )}

              <View style={styles.tossRow}>
                <ThemeText
                  style={styles.tossLine}
                  color="desText"
                  numberOfLines={2}
                >
                  {tossWinnerName
                    ? `${tossWinnerName} won the toss and chose to ${currentMatch?.electedTo}.`
                    : 'Tap to continue scoring.'}
                </ThemeText>

                <View
                  style={[
                    styles.continuePillInline,
                    { backgroundColor: theme.primaryMuted },
                  ]}
                >
                  <ThemeText style={styles.continueText} color="primary">
                    Continue →
                  </ThemeText>
                </View>
              </View>
            </MatchCard>
          ) : (
            <View
              style={[
                styles.liveEmptyCard,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemeText style={styles.emptyTitle} color="text">
                No match in progress
              </ThemeText>
              <ThemeText style={styles.emptyBody} color="secondaryText">
                Start a match to score ball-by-ball. Your live card will appear
                here.
              </ThemeText>
            </View>
          )}
        </View>

        <View
          style={[
            styles.heroIntroCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemeText style={styles.heroTitle} color="text">
            Matches & scoring
          </ThemeText>
          <ThemeText style={styles.heroText} color="secondaryText">
            Start a fresh match, manage teams, and continue live scoring all
            from one place.
          </ThemeText>

          <Button
            title="Start new match"
            onPress={StartMatch}
            buttonStyle={styles.primaryCta}
            titleStyle={styles.primaryCtaText}
            leftIcon={matches}
            leftIconTintColor={theme.white}
          />
        </View>

        <View style={styles.section}>
          <View
            style={[
              styles.recentHeroCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.recentTitleRow}>
              <ThemeText style={styles.sectionTitle} color="text">
                Recent matches
              </ThemeText>
            </View>

            <ThemeText style={styles.recentSubText} color="secondaryText">
              Browse completed matches and open full scorecards anytime.
            </ThemeText>

            <Button
              title="View match history"
              onPress={openHistory}
              buttonStyle={styles.recentCta}
            />
          </View>
        </View>
      </ScrollView>
    </HomeWrapper>
  );
};

export default Matches;

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  content: {
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(32),
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
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
});
