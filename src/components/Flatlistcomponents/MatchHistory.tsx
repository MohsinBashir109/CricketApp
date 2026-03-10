import {
  FlatList,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import { MatchSetup } from '../../types/Playertype';
import React from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { routes } from '../../utils/routes';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../../theme/themeContext';

interface MatchHistory {
  history?: MatchSetup[];
}

const MatchHistory = ({ history }: MatchHistory) => {
  const { isDark } = useThemeContext();
  const navigation = useNavigation();
  const openSummary = (item: any) => {
    // @ts-ignore
    navigation.navigate(routes.matchsummary, { match: item });
  };
  const getTeamSize = (match: MatchSetup, teamKey: 'teamA' | 'teamB') => {
    const count =
      teamKey === 'teamA'
        ? match.teamA?.players?.length
        : match.teamB?.players?.length;

    // valid: 1..10 (less than 11) — adjust if you want 11 allowed
    if (typeof count === 'number' && count > 0 && count <= 11) return count;

    return null; // invalid / missing
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

        // If teamSize unknown, don't show wickets remaining number
        if (!teamSize) return `${winner} won (chased)`;

        const maxWickets = Math.max(teamSize - 1, 0); // teamSize=2 => 1 wicket max
        const wicketsLost = i2.totalWickets ?? 0;

        const wicketsRemaining = Math.max(maxWickets - wicketsLost, 0);

        return `${winner} won by ${wicketsRemaining} wicket${
          wicketsRemaining === 1 ? '' : 's'
        }`;
      }

      case 'DEFENDED': {
        const runs1 = i1.totalRuns ?? 0;
        const runs2 = i2.totalRuns ?? 0;

        // margin should never be negative on display
        const runsMargin = Math.abs(runs1 - runs2);

        return `${winner} won by ${runsMargin} run${
          runsMargin === 1 ? '' : 's'
        }`;
      }

      case 'TIE':
        return 'Match tied';

      default:
        return 'Result not available';
    }
  };

  const renderItem = ({ item }: { item: MatchSetup }) => {
    return (
      <TouchableOpacity
        style={[
          styles.conatiner,
          {
            backgroundColor: colors[isDark ? 'dark' : 'light'].background,
            borderColor: colors[isDark ? 'dark' : 'light'].gray4,
            borderWidth: 1,
            borderRadius: widthPixel(15),
          },
        ]}
        onPress={() => openSummary(item)}
      >
        <View style={styles.header}>
          <ThemeText color="text" style={styles.headerText}>
            {item?.teamA?.name}
          </ThemeText>
          <ThemeText color="text" style={styles.headerText2}>
            V
          </ThemeText>
          <ThemeText color="text" style={styles.headerText3}>
            {item?.teamB?.name}
          </ThemeText>
          <View style={{ flex: 1 }} />
          <ThemeText color="text" style={styles.headerText3}>
            Match Summary
          </ThemeText>
        </View>
        <ThemeText color="text" style={styles.headerText3}>
          {getIccResultText(item)}
        </ThemeText>
      </TouchableOpacity>
    );
  };

  console.log('_----------------------->', history);
  return (
    <FlatList
      data={history}
      renderItem={renderItem}
      keyExtractor={item => item?.matchId}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default MatchHistory;

const styles = StyleSheet.create({
  conatiner: {
    marginBottom: heightPixel(10),
    paddingHorizontal: widthPixel(15),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: widthPixel(10),
  },
  headerText: { fontFamily: fontFamilies.semibold, fontSize: fontPixel(15) },
  headerText2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
    marginHorizontal: widthPixel(10),
  },
  headerText3: { fontFamily: fontFamilies.semibold, fontSize: fontPixel(15) },
});
