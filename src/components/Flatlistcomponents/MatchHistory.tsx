import { StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';

import { MatchSetup } from '../../types/Playertype';
import React from 'react';
import ThemeText from '../ThemeText';
import MatchCard from '../MatchCard';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { routes } from '../../utils/routes';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../../theme/themeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../features/store/rootReducer';

interface MatchHistoryProps {
  history?: MatchSetup[];
}

const MatchHistory = ({ history }: MatchHistoryProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const navigation = useNavigation();
  const tournamentsById = useSelector((s: RootState) => s.tournament.tournamentsById);

  const openSummary = (item: MatchSetup) => {
    // @ts-ignore
    navigation.navigate(routes.matchsummary, { match: item });
  };

  const getTeamSize = (match: MatchSetup, teamKey: 'teamA' | 'teamB') => {
    const count =
      teamKey === 'teamA'
        ? match.teamA?.players?.length
        : match.teamB?.players?.length;

    if (typeof count === 'number' && count > 0 && count <= 11) return count;
    return null;
  };

  const getIccResultText = (match: MatchSetup) => {
    const winner = match.winnerTeamName?.trim() || 'Unknown team';
    const reason = match.resultReason;

    const i1 = match.innings1;
    const i2 = match.innings2;

    if (!reason) return 'Result not available';
    if (!i1 || !i2) return 'Result not available';

    switch (reason) {
      case 'CHASED': {
        const battingTeamKey = i2.battingTeam;
        const teamSize = getTeamSize(match, battingTeamKey);
        if (!teamSize) return `${winner} won (chased)`;
        const maxWickets = Math.max(teamSize - 1, 0);
        const wicketsLost = i2.totalWickets ?? 0;
        const wicketsRemaining = Math.max(maxWickets - wicketsLost, 0);
        return `${winner} won by ${wicketsRemaining} wicket${
          wicketsRemaining === 1 ? '' : 's'
        }`;
      }
      case 'DEFENDED': {
        const runs1 = i1.totalRuns ?? 0;
        const runs2 = i2.totalRuns ?? 0;
        const runsMargin = Math.abs(runs1 - runs2);
        return `${winner} won by ${runsMargin} run${runsMargin === 1 ? '' : 's'}`;
      }
      case 'TIE':
        return 'Match tied';
      default:
        return 'Result not available';
    }
  };

  const renderItem = ({ item }: { item: MatchSetup }) => (
    <MatchCard
      teamAName={item?.teamA?.name}
      teamBName={item?.teamB?.name}
      onPress={() => openSummary(item)}
      matchTypeLabel={
        item?.tournamentId
          ? tournamentsById?.[item.tournamentId]?.name ?? 'Tournament'
          : 'Simple match'
      }
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}
        >
          <ThemeText color="secondaryText" style={styles.statusText}>
            Completed
          </ThemeText>
        </View>
        <ThemeText color="desText" style={styles.metaRight}>
          Tap to view scorecard
        </ThemeText>
      </View>

      <View style={[styles.resultPill, { backgroundColor: theme.primaryMuted }]}>
        <ThemeText color="primary" style={styles.resultText} numberOfLines={2}>
          {getIccResultText(item)}
        </ThemeText>
      </View>
    </MatchCard>
  );

  if (!history?.length) {
    return (
      <View
        style={[
          styles.empty,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
        ]}
      >
        <ThemeText style={styles.emptyTitle} color="text">
          No history yet
        </ThemeText>
        <ThemeText style={styles.emptyBody} color="secondaryText">
          Finished matches appear here with full scorecards.
        </ThemeText>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {history.map(item => (
        <View key={item.matchId}>{renderItem({ item })}</View>
      ))}
    </View>
  );
};

export default MatchHistory;

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  list: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(4),
    borderRadius: widthPixel(999),
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
  },
  metaRight: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
  },
  resultPill: {
    marginTop: heightPixel(10),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
    borderRadius: widthPixel(12),
  },
  resultText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
    lineHeight: fontPixel(18),
  },
  hint: {
    marginTop: heightPixel(8),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
  },
  empty: {
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
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
});
