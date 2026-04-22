import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import CreateTournamentFlow from '../../../components/Tournament/CreateTournamentFlow';
import { selectActiveTeams, selectAllTournaments } from '../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { cardShadowLg } from '../../../utils/cardShadow';
import { routes } from '../../../utils/routes';
import HomeWrapper from '../../../wrappers/HomeWrapper';

const TournamentsHome = ({ navigation }: any) => {
  const [createExpanded, setCreateExpanded] = useState(false);
  const tournaments = useSelector(selectAllTournaments);
  const teams = useSelector(selectActiveTeams);
  const { isDark } = useThemeContext();
  const themeColors = colors[isDark ? 'dark' : 'light'];

  const activeCount = useMemo(
    () => tournaments.filter(t => t.status !== 'completed').length,
    [tournaments],
  );

  return (
    <HomeWrapper headerShown>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.heroCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <ThemeText color="text" style={styles.heroTitle}>
            Tournament Center
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.heroText}>
            Start here to create a tournament, then manage history and active
            tournaments below.
          </ThemeText>

          <CreateTournamentFlow
            navigation={navigation}
            expanded={createExpanded}
            onCollapse={() => setCreateExpanded(false)}
          />

          {!createExpanded ? (
            <Button title="Create Tournament" onPress={() => setCreateExpanded(true)} />
          ) : (
            <Pressable
              onPress={() => setCreateExpanded(false)}
              style={styles.collapseLink}
              hitSlop={12}
            >
              <ThemeText color="primary" style={styles.collapseText}>
                Collapse
              </ThemeText>
            </Pressable>
          )}
          {teams.length < 2 ? (
            <ThemeText color="secondaryText" style={styles.helperText}>
              You need at least two saved teams to finish creating a tournament
              (you can add teams inside “Choose teams”).
            </ThemeText>
          ) : null}
        </View>

        <View
          style={[
            styles.historyCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <ThemeText color="text" style={styles.cardTitle}>
            Tournament history
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.historyText}>
            View your saved tournaments and open their details anytime.
          </ThemeText>
          <Button
            title="View tournament history"
            onPress={() => navigation.navigate(routes.matchHistory, { initialTab: 'tournament' })}
            buttonStyle={styles.historyCta}
          />
        </View>

        <View
          style={[
            styles.historyCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.cardTitleRow}>
            <ThemeText color="text" style={styles.cardTitle}>
              Active tournaments
            </ThemeText>
          </View>
          <ThemeText color="secondaryText" style={styles.historyText}>
            Continue tournaments that are not completed yet.
          </ThemeText>
          <Button
            title="View active tournaments"
            onPress={() => navigation.navigate(routes.uncompletedTournaments)}
            buttonStyle={styles.historyCta}
            disabled={activeCount === 0}
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
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: widthPixel(20),
    padding: widthPixel(18),
  },
  heroTitle: {
    fontSize: fontPixel(24),
    fontFamily: fontFamilies.bold,
  },
  heroText: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(21),
  },
  helperText: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(12),
  },
  collapseLink: {
    marginTop: heightPixel(12),
    alignSelf: 'flex-start',
    paddingVertical: heightPixel(6),
  },
  collapseText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
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
