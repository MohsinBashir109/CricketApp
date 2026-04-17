import React, { useState } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { TabView } from 'react-native-tab-view';
import ThemeText from '../../../components/ThemeText';
import {
  selectTournamentById,
  selectTournamentGroups,
  selectTournamentTeams,
} from '../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { RootState } from '../../../features/store/rootReducer';
import TournamentFixturesTab from './tabs/TournamentFixturesTab';
import TournamentOverviewTab from './tabs/TournamentOverviewTab';
import TournamentPointsTab from './tabs/TournamentPointsTab';
import TournamentStatsTab from './tabs/TournamentStatsTab';
import TournamentTeamsTab from './tabs/TournamentTeamsTab';

const TournamentDetailsScreen = ({ route, navigation }: any) => {
  const tournamentId = route?.params?.tournamentId as string;
  const tournament = useSelector((state: RootState) =>
    selectTournamentById(state, tournamentId),
  );
  const groups = useSelector((state: RootState) =>
    selectTournamentGroups(state, tournamentId),
  );
  const teams = useSelector((state: RootState) =>
    selectTournamentTeams(state, tournamentId),
  );
  const { isDark } = useThemeContext();
  const themeColors = colors[isDark ? 'dark' : 'light'];

  if (!tournament) {
    return (
      <HomeWrapper>
        <View style={styles.missingState}>
          <ThemeText color="text" style={styles.title}>
            Tournament not found
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.subtitle}>
            The selected tournament could not be loaded from local storage.
          </ThemeText>
        </View>
      </HomeWrapper>
    );
  }

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'overview', title: 'Overview' },
    { key: 'teams', title: 'Teams' },
    { key: 'fixtures', title: 'Fixtures' },
    { key: 'points', title: 'Points' },
    { key: 'stats', title: 'Stats' },
  ]);

  const renderScene = ({ route: r }: any) => {
    switch (r.key) {
      case 'overview':
        return (
          <TournamentOverviewTab
            tournamentId={tournamentId}
            onOpenFixtures={() => setIndex(2)}
          />
        );
      case 'teams':
        return <TournamentTeamsTab tournamentId={tournamentId} />;
      case 'fixtures':
        return <TournamentFixturesTab tournamentId={tournamentId} navigation={navigation} />;
      case 'points':
        return <TournamentPointsTab tournamentId={tournamentId} />;
      case 'stats':
        return <TournamentStatsTab tournamentId={tournamentId} />;
      default:
        return null;
    }
  };

  const CustomTabBar = ({ navigationState, jumpTo }: any) => (
    <View
      style={[
        styles.tabBar,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
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
                backgroundColor: themeColors.primaryMuted,
                borderColor: themeColors.primary,
              },
            ]}
          >
            <ThemeText
              style={styles.tabLabel}
              color={active ? 'primary' : 'secondaryText'}
              numberOfLines={1}
            >
              {r.title}
            </ThemeText>
          </Pressable>
        );
      })}
    </View>
  );

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
            styles.heroCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              paddingTop:
                Platform.OS === 'android'
                  ? (StatusBar.currentHeight ?? 0) + heightPixel(12)
                  : heightPixel(16),
            },
          ]}
        >
          <ThemeText color="text" style={styles.title}>
            {tournament.name}
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.subtitle}>
            {tournament.competitionType} •{' '}
            {tournament.formatType === 'groupBased'
              ? `${groups.length} groups`
              : 'Open'}
          </ThemeText>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: themeColors.primaryMuted }]}>
              <ThemeText color="primary" style={styles.badgeText}>
                {tournament.status.toUpperCase()}
              </ThemeText>
            </View>
            <View style={[styles.badge, { backgroundColor: themeColors.primaryMuted }]}>
              <ThemeText color="primary" style={styles.badgeText}>
                {teams.length} TEAMS
              </ThemeText>
            </View>
          </View>

          <CustomTabBar navigationState={{ index, routes }} jumpTo={(k: string) => {
            const idx = routes.findIndex(r => r.key === k);
            if (idx >= 0) setIndex(idx);
          }} />
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
  heroCard: {
    borderWidth: 1,
    borderRadius: widthPixel(20),
    padding: widthPixel(18),
    marginBottom: heightPixel(14),
  },
  title: {
    fontSize: fontPixel(24),
    fontFamily: fontFamilies.bold,
  },
  subtitle: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
    marginTop: heightPixel(14),
  },
  badge: {
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(12),
    borderRadius: widthPixel(999),
  },
  badgeText: {
    fontSize: fontPixel(11),
    fontFamily: fontFamilies.bold,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: heightPixel(16),
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
    fontSize: fontPixel(12),
  },
});

export default TournamentDetailsScreen;
