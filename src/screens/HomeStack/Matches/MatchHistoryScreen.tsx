import React, { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { SceneMap, TabView } from 'react-native-tab-view';
import MatchHistory from '../../../components/Flatlistcomponents/MatchHistory';
import ThemeText from '../../../components/ThemeText';
import { backarrow, historybackgroung } from '../../../assets/images';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowSm } from '../../../utils/cardShadow';
import { useThemeContext } from '../../../theme/themeContext';
import { useWindowDimensions } from 'react-native';
import { selectAllTournaments } from '../../../features/tournament/tournamentSelectors';
import { routes } from '../../../utils/routes';
import { useRoute } from '@react-navigation/native';

const TORN_CARD = require('../../../assets/images/tornamentcard.png');

const MatchHistoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const match = useSelector((state: any) => state.match);
  const tournaments = useSelector(selectAllTournaments);
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [tabRoutes] = useState([
    { key: 'single', title: 'Single matches' },
    { key: 'tournament', title: 'Tournament' },
  ]);

  useEffect(() => {
    const initialTab = route?.params?.initialTab;
    if (initialTab === 'tournament') setIndex(1);
    else if (initialTab === 'single') setIndex(0);
  }, [route?.params?.initialTab]);

  const CustomTabBar = ({ navigationState, jumpTo }: any) => {
    return (
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        {navigationState.routes.map((r: any, i: number) => {
          const active = navigationState.index === i;
          return (
            <Pressable
              key={r.key}
              onPress={() => jumpTo(r.key)}
              style={[
                styles.tabItem,
                active && {
                  backgroundColor: theme.primaryMuted,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemeText
                style={styles.tabLabel}
                color={active ? 'primary' : 'secondaryText'}
              >
                {r.title}
              </ThemeText>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const SingleMatchesRoute = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <MatchHistory history={match?.history} cardArt cardAccent="primary" />
    </ScrollView>
  );

  const TournamentRoute = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {tournaments.filter(t => t.status === 'completed').length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemeText color="text" style={styles.emptyTitle}>
            No completed tournaments
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.emptyText}>
            Completed tournaments will appear here after all matches finish.
          </ThemeText>
        </View>
      ) : (
        tournaments
          .filter(tournament => tournament.status === 'completed')
          .map(tournament => (
            <Pressable
              key={tournament.id}
              // @ts-ignore
              onPress={() =>
                navigation.navigate(routes.tournamentDetails, {
                  tournamentId: tournament.id,
                })
              }
              style={({ pressed }) => [
                styles.tournamentCardOuter,
                isDark ? styles.cardShadowDark : styles.cardShadowLight,
                {
                  borderColor: theme.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View style={styles.tournamentCardArt}>
                <Image
                  source={TORN_CARD}
                  style={styles.tournamentCardBg}
                  resizeMode="cover"
                />
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: isDark
                        ? 'rgba(0,0,0,0.22)'
                        : 'rgba(255,255,255,0.28)',
                    },
                  ]}
                  pointerEvents="none"
                />
                <View style={styles.tournamentCardInner}>
                  <View style={styles.tournamentHeader}>
                    <ThemeText color="text" style={styles.tournamentName}>
                      {tournament.name}
                    </ThemeText>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(215,166,61,0.22)'
                            : 'rgba(215,166,61,0.3)',
                        },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: theme.accent }]}
                        numberOfLines={1}
                      >
                        {String(tournament.status).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <ThemeText color="secondaryText" style={styles.tournamentMeta}>
                    {tournament.formatType === 'groupBased'
                      ? `${tournament.groupCount} groups`
                      : 'Open tournament'}
                  </ThemeText>
                  <ThemeText color="secondaryText" style={styles.tournamentMeta}>
                    {tournament.teamCount} teams
                  </ThemeText>
                </View>
              </View>
            </Pressable>
          ))
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({
    single: SingleMatchesRoute,
    tournament: TournamentRoute,
  });

  return (
    <ImageBackground
      source={historybackgroung}
      style={styles.root}
      resizeMode="cover"
      imageStyle={[styles.bgImage, isDark ? styles.bgImageDark : styles.bgImageLight]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          isDark ? styles.scrimDark : styles.scrimLight,
        ]}
      />
      <View style={styles.contentShell}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />

        <View
          style={[
            styles.topBar,
            {
              paddingTop:
                Platform.OS === 'android'
                  ? (StatusBar.currentHeight ?? 0) + 8
                  : 52,
              backgroundColor: isDark
                ? 'rgba(20, 26, 24, 0.92)'
                : 'rgba(255, 255, 255, 0.94)',
              borderBottomColor: theme.border,
            },
          ]}
        >
          <Pressable hitSlop={16} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Image source={backarrow} style={styles.backIcon} tintColor={theme.text} />
          </Pressable>
          <View style={styles.topTitles}>
            <ThemeText style={styles.screenTitle} color="text">
              Match history
            </ThemeText>
            <ThemeText style={styles.screenSub} color="secondaryText">
              Matches and tournaments
            </ThemeText>
          </View>
        </View>

        <TabView
          navigationState={{ index, routes: tabRoutes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={props => <CustomTabBar {...props} />}
          initialLayout={{ width: layout.width }}
        />
      </View>
    </ImageBackground>
  );
};

export default MatchHistoryScreen;

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  root: {
    flex: 1,
    width: '100%',
  },
  bgImage: {
    transform: [{ scale: 1.04 }],
  },
  bgImageLight: {
    opacity: 0.5,
  },
  bgImageDark: {
    opacity: 0.4,
  },
  scrimLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrimDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  contentShell: {
    flex: 1,
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: widthPixel(16),
  },
  backIcon: {
    width: widthPixel(22),
    height: heightPixel(22),
  },
  topTitles: {
    flex: 1,
    alignItems: 'center',
  },
  screenTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
    textAlign: 'center',
  },
  screenSub: {
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
    textAlign: 'center',
  },
  content: {
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(32),
    paddingHorizontal: widthPixel(16),
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: widthPixel(12),
    marginTop: heightPixel(12),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(4),
    gap: widthPixel(6),
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
    fontSize: fontPixel(14),
  },
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
  tournamentCardOuter: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    marginBottom: heightPixel(12),
    overflow: 'hidden',
  },
  tournamentCardArt: {
    borderRadius: widthPixel(17),
    overflow: 'hidden',
    minHeight: heightPixel(88),
  },
  tournamentCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  tournamentCardInner: {
    padding: widthPixel(16),
    position: 'relative',
    zIndex: 1,
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

