import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../components/ThemeText';
import { selectAllTournaments } from '../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { routes } from '../../../utils/routes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { backarrow } from '../../../assets/images';

const UncompletedTournamentsScreen = ({ navigation }: any) => {
  const tournaments = useSelector(selectAllTournaments);
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  const activeTournaments = useMemo(
    () => tournaments.filter(t => t.status !== 'completed'),
    [tournaments],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Pressable hitSlop={16} onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Image source={backarrow} style={styles.backIcon} tintColor={theme.text} />
        </Pressable>
        <View style={styles.topTitles}>
          <ThemeText style={styles.screenTitle} color="text">
            Active tournaments
          </ThemeText>
          <ThemeText style={styles.screenSub} color="secondaryText">
            Upcoming and ongoing
          </ThemeText>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {activeTournaments.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ThemeText color="text" style={styles.emptyTitle}>
              No active tournaments
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.emptyText}>
              Completed tournaments will stay in history. Create a new tournament to get started.
            </ThemeText>
          </View>
        ) : (
          activeTournaments.map(tournament => (
            <Pressable
              key={tournament.id}
              onPress={() =>
                navigation.navigate(routes.tournamentDetails, {
                  tournamentId: tournament.id,
                })
              }
              style={[
                styles.tournamentCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.tournamentHeader}>
                <ThemeText color="text" style={styles.tournamentName}>
                  {tournament.name}
                </ThemeText>
                <View style={[styles.badge, { backgroundColor: theme.primaryMuted }]}>
                  <ThemeText color="primary" style={styles.badgeText}>
                    {tournament.status.toUpperCase()}
                  </ThemeText>
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
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  content: {
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(32),
    paddingHorizontal: widthPixel(16),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: widthPixel(16),
  },
  backIcon: {
    width: widthPixel(20),
    height: heightPixel(20),
  },
  topTitles: {
    flex: 1,
    alignItems: 'center',
  },
  screenTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    textAlign: 'center',
  },
  screenSub: {
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    textAlign: 'center',
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

export default UncompletedTournamentsScreen;

