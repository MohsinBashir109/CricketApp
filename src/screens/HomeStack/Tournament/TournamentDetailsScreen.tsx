import React, { useState } from 'react';
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
import { cardShadowLg, cardShadowSm } from '../../../utils/cardShadow';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { RootState } from '../../../features/store/rootReducer';
import TournamentFixturesTab from './tabs/TournamentFixturesTab';
import TournamentPointsTab from './tabs/TournamentPointsTab';
import TournamentStatsTab from './tabs/TournamentStatsTab';
import TournamentTeamsTab from './tabs/TournamentTeamsTab';
import { cardbackgroun, cardt } from '../../../assets/images';
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

  if (!tournament) {
    return (
      <HomeWrapper>
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
    const blue = isDark ? '#3EA0FF' : '#1565D8';
    return (
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
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
              style={[styles.tabItem, active && {}]}
            >
              <Image
                source={iconSource}
                style={[
                  styles.tabIcon,
                  {
                    tintColor: active
                      ? blue
                      : themeColors.tabIconDefault ?? themeColors.gray2,
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
                      color: active
                        ? blue
                        : themeColors.tabIconDefault ?? themeColors.gray2,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {r.title}
                </Text>
              </ThemeText>
              {active ? (
                <View
                  style={[styles.activeUnderline, { backgroundColor: blue }]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <HomeWrapper>
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
          <View
            style={[
              styles.heroCardWrap,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
              },
            ]}
          >
          <View style={[styles.heroCard]}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconCircle}>
                <Image
                  source={cardt}
                  style={[styles.heroIcon, { tintColor: '#1565D8' }]}
                />
              </View>
            </View>

            <ThemeText color="text" style={styles.title}>
              {tournament.name}
            </ThemeText>

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
                  isDark ? styles.infoShadowDark : styles.infoShadowLight,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <View style={styles.infoIconCircle}>
                  <Image
                    source={matches}
                    style={[styles.infoIcon, { tintColor: '#1565D8' }]}
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
                  <ThemeText
                    color="secondaryText"
                    style={styles.infoSub}
                    numberOfLines={1}
                  >
                    Matches ahead
                  </ThemeText>
                </View>
              </View>

              <View
                style={[
                  styles.infoCard,
                  isDark ? styles.infoShadowDark : styles.infoShadowLight,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <View style={styles.infoIconCircle}>
                  <Image
                    source={players}
                    style={[styles.infoIcon, { tintColor: '#1565D8' }]}
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
                  <ThemeText
                    color="secondaryText"
                    style={styles.infoSub}
                    numberOfLines={1}
                  >
                    Competing
                  </ThemeText>
                </View>
              </View>
              <View
                style={[
                  styles.infoCard,
                  isDark ? styles.infoShadowDark : styles.infoShadowLight,
                  {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <View style={styles.infoIconCircle}>
                  <Image
                    source={throphy}
                    style={[styles.infoIcon, { tintColor: '#1565D8' }]}
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
                  <ThemeText
                    color="secondaryText"
                    style={styles.infoSub}
                    numberOfLines={1}
                  >
                    Schedule
                  </ThemeText>
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
          <ImageBackground
            imageStyle={{ opacity: 0.75 }}
            source={cardbackgroun}
            resizeMode="contain"
            style={{
              width: widthPixel(260),
              height: heightPixel(260),
              position: 'absolute',
              top: heightPixel(-80),
              right: widthPixel(-60),
              opacity: 0.85,
              borderTopRightRadius: widthPixel(20),
            }}
          />
          </View>
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
  heroShadowLight: cardShadowLg(false),
  heroShadowDark: cardShadowLg(true),
  heroCardWrap: {
    width: '100%',
    borderWidth: 1,
    borderRadius: widthPixel(20),
    overflow: 'hidden',
    // marginBottom: heightPixel(14),
  },
  heroCard: {
    borderRadius: widthPixel(20),
    padding: widthPixel(14),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: heightPixel(4),
    // elevation: 2,
  },
  heroIconCircle: {
    width: widthPixel(60),
    height: widthPixel(60),
    borderRadius: widthPixel(999),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,101,216,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(21,101,216,0.22)',
  },
  heroIcon: {
    width: widthPixel(40),
    height: widthPixel(40),
    resizeMode: 'contain',
  },
  title: {
    fontSize: fontPixel(20),
    fontFamily: fontFamilies.bold,
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
    gap: widthPixel(5),
    marginTop: heightPixel(10),

    // backgroundColor: 'red',
  },
  infoCard: {
    // width: widthPixel(108),
    // height: heightPixel(58),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderRadius: widthPixel(10),
    width: widthPixel(105),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(8),
    zIndex: 9999,
  },
  infoShadowLight: cardShadowSm(false),
  infoShadowDark: cardShadowSm(true),
  infoIconCircle: {
    width: widthPixel(25),
    height: widthPixel(25),
    borderRadius: widthPixel(999),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,101,216,0.10)',
  },
  infoIcon: {
    width: widthPixel(13),
    height: widthPixel(13),
    resizeMode: 'contain',
  },
  infoTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(9),
    letterSpacing: 0.3,
    textAlign: 'left',
  },
  infoSub: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(9),
    lineHeight: fontPixel(13),
    textAlign: 'left',
  },
  infoTextCol: {
    // flex: 1,
    minWidth: 0,
    marginLeft: widthPixel(5),
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: heightPixel(10),
    borderRadius: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(4),
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
    marginTop: heightPixel(6),
    height: heightPixel(2),
    width: widthPixel(30),
    borderRadius: widthPixel(999),
  },
});

export default TournamentDetailsScreen;
