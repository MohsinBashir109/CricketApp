import React, { useCallback, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { TabView } from 'react-native-tab-view';
import ThemeText from '../../../components/ThemeText';
import {
  selectTournamentById,
  selectTournamentTeams,
} from '../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowLg } from '../../../utils/cardShadow';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { RootState } from '../../../features/store/rootReducer';
import TournamentFixturesTab from './tabs/TournamentFixturesTab';
import TournamentPointsTab from './tabs/TournamentPointsTab';
import TournamentStatsTab from './tabs/TournamentStatsTab';
import TournamentTeamsTab from './tabs/TournamentTeamsTab';
import { fixturecard } from '../../../assets/images';
import {
  lightning,
  matches,
  players,
  team,
  throphy,
} from '../../../assets/images';

const TournamentDetailsScreen = ({ route, navigation }: any) => {
  const tournamentId = route?.params?.tournamentId as string;
  const tournament = useSelector((state: RootState) =>
    selectTournamentById(state, tournamentId),
  );
  const teams = useSelector((state: RootState) =>
    selectTournamentTeams(state, tournamentId),
  );
  const { isDark } = useThemeContext();
  const themeColors = colors[isDark ? 'dark' : 'light'];

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'teams', title: 'Teams' },
    { key: 'fixtures', title: 'Fixtures' },
    { key: 'points', title: 'Points' },
    { key: 'stats', title: 'Stats' },
  ]);

  useFocusEffect(
    useCallback(() => {
      const initialTab = route?.params?.initialTab as string | undefined;
      if (initialTab === 'fixtures') {
        setIndex(1);
        navigation.setParams({ initialTab: undefined } as Record<
          string,
          unknown
        >);
      }
    }, [navigation, route?.params?.initialTab]),
  );

  if (!tournament) {
    return (
      <HomeWrapper headerShown>
        <View style={styles.missingState}>
          <ThemeText color="text" style={styles.title}>
            Tournament not found
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.missingSubtitle}>
            The selected tournament could not be loaded from local storage.
          </ThemeText>
        </View>
      </HomeWrapper>
    );
  }

  const heroCatchLine = (() => {
    if (tournament.status === 'ongoing') {
      return "LIVE. Gaps, partnerships, the table, all still in play, don't blink.";
    }
    if (tournament.status === 'completed') {
      return "That's the game, end of innings. Rivalry, results, the lot, it all stays on this page.";
    }
    return "Stumps, squads, a draw on the wall. The first over starts when you say go.";
  })();
  /** Surfaces that sit on the warm-gold/cream art, not cold white or neon blue. */
  const heroInCardBg = isDark
    ? 'rgba(14, 24, 44, 0.5)'
    : 'rgba(255, 250, 242, 0.9)';
  const heroInCardBorder = isDark
    ? 'rgba(110, 150, 210, 0.2)'
    : 'rgba(190, 150, 95, 0.2)';
  const heroInCardIconPill = isDark
    ? 'rgba(120, 175, 255, 0.1)'
    : 'rgba(55, 95, 150, 0.08)';
  const heroMutedBlue = isDark ? 'rgba(170, 200, 255, 0.85)' : '#3D5A7B';
  const infoIconBlue = isDark ? 'rgba(150, 190, 255, 0.95)' : '#3A5580';
  const heroOuterBorder = isDark
    ? themeColors.border
    : 'rgba(200, 170, 120, 0.28)';

  /** Tab bar: warm gold/cream to match the fixture art (not the default blue chrome). */
  const tabBarSurface = isDark
    ? 'rgba(32, 26, 20, 0.52)'
    : 'rgba(255, 244, 228, 0.9)';
  const tabBarFrameBorder = isDark
    ? 'rgba(200, 165, 100, 0.22)'
    : 'rgba(200, 160, 95, 0.3)';
  const tabBarActivePill = isDark
    ? 'rgba(200, 150, 70, 0.22)'
    : 'rgba(255, 215, 170, 0.55)';
  const tabBarActiveGold = isDark ? themeColors.accent : '#5C3D1A';
  const tabBarInactive = isDark
    ? 'rgba(175, 165, 150, 0.65)'
    : 'rgba(95, 78, 60, 0.48)';

  const renderScene = ({ route: r }: any) => {
    switch (r.key) {
      case 'teams':
        return (
          <TournamentTeamsTab
            tournamentId={tournamentId}
            navigation={navigation}
          />
        );
      case 'fixtures':
        return (
          <TournamentFixturesTab
            tournamentId={tournamentId}
            navigation={navigation}
          />
        );
      case 'points':
        return <TournamentPointsTab tournamentId={tournamentId} />;
      case 'stats':
        return <TournamentStatsTab tournamentId={tournamentId} />;
      default:
        return null;
    }
  };

  const CustomTabBar = ({ navigationState, jumpTo }: any) => {
    return (
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: tabBarSurface,
            borderColor: tabBarFrameBorder,
          },
        ]}
      >
        {navigationState.routes.map((r: any, i: number) => {
          const active = navigationState.index === i;
          const iconSource =
            r.key === 'teams'
              ? team
              : r.key === 'fixtures'
              ? matches
              : r.key === 'points'
              ? throphy
              : lightning;
          return (
            <Pressable
              key={r.key}
              onPress={() => jumpTo(r.key)}
              style={[
                styles.tabItem,
                active && { backgroundColor: tabBarActivePill },
              ]}
            >
              <Image
                source={iconSource}
                style={[
                  styles.tabIcon,
                  {
                    tintColor: active ? tabBarActiveGold : tabBarInactive,
                  },
                ]}
                resizeMode="contain"
              />
              <ThemeText
                color="secondaryText"
                style={styles.tabLabelShim}
                numberOfLines={1}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: active ? tabBarActiveGold : tabBarInactive,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {r.title}
                </Text>
              </ThemeText>
              {active ? (
                <View
                  style={[
                    styles.activeUnderline,
                    { backgroundColor: tabBarActiveGold },
                  ]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <HomeWrapper headerShown>
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />

        <View
          style={[
            styles.heroShadowWrap,
            isDark ? styles.heroShadowDark : styles.heroShadowLight,
          ]}
        >
          <ImageBackground
            source={fixturecard}
            style={[styles.heroCardWrap, { borderColor: heroOuterBorder }]}
            imageStyle={styles.heroCardBgImage}
            resizeMode="cover"
          >
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: isDark
                    ? 'rgba(0,0,0,0.22)'
                    : 'rgba(255, 248, 238, 0.4)',
                },
              ]}
              pointerEvents="none"
            />
            <View style={styles.heroCardContentLayer}>
              <View style={[styles.heroCard]}>
                <View style={styles.heroTextBlock}>
                  <ThemeText color="text" style={styles.heroTournamentName}>
                    {tournament.name}
                  </ThemeText>
                  <Text
                    style={[styles.heroCatchLine, { color: heroMutedBlue }]}
                    numberOfLines={3}
                  >
                    {heroCatchLine}
                  </Text>
                </View>

                {/* <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <ThemeText color="secondaryText" style={styles.statusText}>
                {tournament.formatType === 'groupBased'
                  ? `${groups.length} groups`
                  : 'Open'}
              </ThemeText>
            </View> */}

                <View style={styles.infoRow}>
                  <View
                    style={[
                      styles.infoCard,
                      isDark
                        ? styles.infoCardShadowDark
                        : styles.infoCardShadowLight,
                      {
                        backgroundColor: heroInCardBg,
                        borderColor: heroInCardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.infoIconCircle,
                        { backgroundColor: heroInCardIconPill },
                      ]}
                    >
                      <Image
                        source={matches}
                        style={[styles.infoIcon, { tintColor: infoIconBlue }]}
                      />
                    </View>
                    <View style={styles.infoTextCol}>
                      <ThemeText
                        color="text"
                        style={styles.infoTitle}
                        numberOfLines={1}
                      >
                        UPCOMING
                      </ThemeText>
                      <Text
                        style={[styles.infoSub, { color: heroMutedBlue }]}
                        numberOfLines={2}
                      >
                        Up next
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.infoCard,
                      isDark
                        ? styles.infoCardShadowDark
                        : styles.infoCardShadowLight,
                      {
                        backgroundColor: heroInCardBg,
                        borderColor: heroInCardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.infoIconCircle,
                        { backgroundColor: heroInCardIconPill },
                      ]}
                    >
                      <Image
                        source={players}
                        style={[styles.infoIcon, { tintColor: infoIconBlue }]}
                      />
                    </View>
                    <View style={styles.infoTextCol}>
                      <ThemeText
                        color="text"
                        style={styles.infoTitle}
                        numberOfLines={1}
                      >
                        {teams.length} TEAMS
                      </ThemeText>
                      <Text
                        style={[styles.infoSub, { color: heroMutedBlue }]}
                        numberOfLines={2}
                      >
                        All registered
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.infoCard,
                      isDark
                        ? styles.infoCardShadowDark
                        : styles.infoCardShadowLight,
                      {
                        backgroundColor: heroInCardBg,
                        borderColor: heroInCardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.infoIconCircle,
                        { backgroundColor: heroInCardIconPill },
                      ]}
                    >
                      <Image
                        source={throphy}
                        style={[styles.infoIcon, { tintColor: infoIconBlue }]}
                      />
                    </View>
                    <View style={styles.infoTextCol}>
                      <ThemeText
                        color="text"
                        style={styles.infoTitle}
                        numberOfLines={1}
                      >
                        FIXTURE
                      </ThemeText>
                      <Text
                        style={[styles.infoSub, { color: heroMutedBlue }]}
                        numberOfLines={2}
                      >
                        Schedule
                      </Text>
                    </View>
                  </View>

                  {/*  */}
                </View>

                <CustomTabBar
                  navigationState={{ index, routes }}
                  jumpTo={(k: string) => {
                    const idx = routes.findIndex(r => r.key === k);
                    if (idx >= 0) setIndex(idx);
                  }}
                />
              </View>
            </View>
          </ImageBackground>
        </View>

        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={() => null}
        />
      </View>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  missingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingSubtitle: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
    textAlign: 'center',
    paddingHorizontal: widthPixel(18),
  },
  heroShadowWrap: {
    width: '100%',
    marginTop: heightPixel(10),
    borderRadius: widthPixel(20),
  },
  heroShadowLight: {
    shadowColor: 'rgba(55, 40, 25, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  heroShadowDark: cardShadowLg(true),
  heroCardWrap: {
    width: '100%',
    borderWidth: 1,
    borderRadius: widthPixel(20),
    overflow: 'hidden',
  },
  /** Rounds the bitmap inside `ImageBackground` (image is a separate view on some platforms). */
  heroCardBgImage: {
    borderRadius: widthPixel(20),
  },
  heroCardContentLayer: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    alignItems: 'flex-start',
  },
  heroCard: {
    borderRadius: widthPixel(20),
    padding: widthPixel(14),
    width: '100%',
    alignItems: 'flex-start',
  },
  /** Name + copy stay in a left column; card artwork stays in the right area. */
  heroTextBlock: {
    alignSelf: 'flex-start',
    width: '66%',
    minWidth: 0,
  },
  title: {
    fontSize: fontPixel(20),
    fontFamily: fontFamilies.bold,
  },
  heroTournamentName: {
    fontSize: fontPixel(25),
    lineHeight: fontPixel(30),
    fontFamily: fontFamilies.bold,
    textAlign: 'left',
    alignSelf: 'stretch',
    letterSpacing: -0.2,
  },
  heroCatchLine: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(16),
    lineHeight: fontPixel(22),
    fontFamily: fontFamilies.medium,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(8),
    marginTop: heightPixel(8),
  },
  statusDot: {
    width: widthPixel(10),
    height: widthPixel(10),
    borderRadius: widthPixel(999),
    backgroundColor: '#21C16B',
  },
  statusText: {
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
    fontFamily: fontFamilies.medium,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: widthPixel(6),
    marginTop: heightPixel(14),
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(12),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(8),
  },
  infoCardShadowLight: {
    shadowColor: 'rgba(45, 38, 30, 0.18)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 1,
  },
  infoCardShadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconCircle: {
    width: widthPixel(25),
    height: widthPixel(25),
    borderRadius: widthPixel(999),
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    width: widthPixel(13),
    height: widthPixel(13),
    resizeMode: 'contain',
  },
  infoTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(9),
    letterSpacing: 0.4,
    textAlign: 'left',
  },
  infoSub: {
    marginTop: heightPixel(3),
    fontSize: fontPixel(9),
    lineHeight: fontPixel(12),
    textAlign: 'left',
    fontFamily: fontFamilies.medium,
  },
  infoTextCol: {
    // flex: 1,
    minWidth: 0,
    marginLeft: widthPixel(5),
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: heightPixel(12),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(3),
  },
  tabItem: {
    flex: 1,
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(4),
    borderRadius: widthPixel(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabIcon: {
    width: widthPixel(16),
    height: widthPixel(16),
    marginBottom: heightPixel(2),
  },
  tabLabelShim: {
    lineHeight: fontPixel(16),
  },
  tabLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  activeUnderline: {
    marginTop: heightPixel(4),
    height: 2,
    width: widthPixel(22),
    borderRadius: widthPixel(999),
  },
});

export default TournamentDetailsScreen;
