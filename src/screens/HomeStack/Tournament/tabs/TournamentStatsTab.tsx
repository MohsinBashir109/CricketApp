import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../../components/ThemeText';
import { RootState } from '../../../../features/store/rootReducer';
import { selectTournamentStatsSections } from '../../../../features/tournament/tournamentSelectors';
import type { StatsLeaderboardSection } from '../../../../features/tournament/tournamentStatsLeaderboards';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../../utils/constants';
import { cardShadowSm } from '../../../../utils/cardShadow';

const RANK_W = widthPixel(28);
const PLAYER_W = widthPixel(118);

type SectionProps = {
  section: StatsLeaderboardSection;
  theme: (typeof colors)['light'];
  isDark: boolean;
};

const StatsSectionTable = ({ section, theme, isDark }: SectionProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.sectionScroll}
    >
      <View
      style={[
        styles.sectionCard,
        isDark ? styles.cardShadowDark : styles.cardShadowLight,
        { backgroundColor: theme.surface, borderColor: theme.border, minWidth: widthPixel(320) },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>

      <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headRank, { color: theme.secondaryText }]}>#</Text>
        <Text style={[styles.headPlayer, { color: theme.secondaryText }]}>PLAYER</Text>
        {section.columns.map(col => (
          <View key={col.label} style={{ width: col.width, alignItems: 'flex-end' }}>
            <Text style={[styles.headStat, { color: theme.secondaryText }]}>{col.label}</Text>
          </View>
        ))}
      </View>

      {section.rows.map((row, ri) => (
        <View
          key={`${section.id}-${ri}-${row.playerName}`}
          style={[styles.dataRow, { borderBottomColor: theme.border }]}
        >
          <Text style={[styles.cellRank, { color: theme.secondaryText }]}>{row.rank}</Text>
          <View style={{ width: PLAYER_W }}>
            <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>
              {row.playerName}
            </Text>
            <Text style={[styles.teamName, { color: theme.secondaryText }]} numberOfLines={1}>
              {row.teamName}
            </Text>
          </View>
          {row.cells.map((cell, ci) => {
            const bold = section.boldColumnIndex === ci;
            return (
              <View key={`c-${ci}`} style={{ width: section.columns[ci]?.width ?? 40, alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.cellStat,
                    { color: theme.text },
                    bold && { fontFamily: fontFamilies.bold },
                  ]}
                >
                  {cell}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
    </ScrollView>
  );
};

const TournamentStatsTab = ({ tournamentId }: { tournamentId: string }) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const sections = useSelector((s: RootState) => selectTournamentStatsSections(s, tournamentId));
  const matchCount = useSelector(
    (s: RootState) =>
      (s.match.history ?? []).filter(
        m =>
          m.tournamentId === tournamentId &&
          m.isCompleted &&
          m.teamA?.players &&
          m.teamB?.players,
      ).length,
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.root}>
      <ThemeText color="secondaryText" style={styles.intro}>
        Leaderboards from completed matches in this tournament (player names only — no photos).
      </ThemeText>

      {matchCount === 0 ? (
        <View
          style={[
            styles.emptyCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemeText color="text" style={styles.emptyTitle}>
            No scorecards yet
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.emptyBody}>
            Stats are built from finished matches that were scored in the app. Start and complete
            fixtures from the Fixtures tab to see runs, wickets, and more.
          </ThemeText>
        </View>
      ) : sections.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemeText color="text" style={styles.emptyTitle}>
            Not enough data
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.emptyBody}>
            Completed matches were found, but no batting or bowling numbers were recorded on
            players yet.
          </ThemeText>
        </View>
      ) : (
        sections.map(sec => (
          <StatsSectionTable key={sec.id} section={sec} theme={theme} isDark={isDark} />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  sectionScroll: {
    marginBottom: heightPixel(12),
  },
  root: {
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(32),
    paddingHorizontal: widthPixel(12),
  },
  intro: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    marginBottom: heightPixel(4),
    paddingHorizontal: widthPixel(2),
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(10),
  },
  sectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    marginBottom: heightPixel(10),
    paddingHorizontal: widthPixel(2),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: heightPixel(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headRank: {
    width: RANK_W,
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headPlayer: {
    width: PLAYER_W,
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
    letterSpacing: 0.5,
  },
  headStat: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: heightPixel(48),
    paddingVertical: heightPixel(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellRank: {
    width: RANK_W,
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
    textAlign: 'center',
  },
  playerName: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  teamName: {
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
  },
  cellStat: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
    fontVariant: ['tabular-nums'],
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    padding: widthPixel(14),
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
    marginBottom: heightPixel(6),
  },
  emptyBody: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
});

export default TournamentStatsTab;
