import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { useDispatch } from 'react-redux';

import AddPlayers from '../Flatlistcomponents/AddPlayers';
import Button from '../themeButton';
import { MatchSetup, Player, Team } from '../../types/Playertype';

/** Both squads often used ids 1..n; scoring needs globally unique numeric ids. */
const PLAYER_ID_BLOCK = 1_000_000;

function withGloballyUniquePlayerIds(m: MatchSetup): MatchSetup {
  const remap = (team: Team | null, blockIndex: 0 | 1): Team | null => {
    if (!team) return team;
    const base = PLAYER_ID_BLOCK * (blockIndex + 1);
    return {
      ...team,
      players: team.players.map((p, i) => ({ ...p, id: base + i })),
    };
  };
  return {
    ...m,
    teamA: remap(m.teamA, 0),
    teamB: remap(m.teamB, 1),
  };
}
import OverSelection from '../Flatlistcomponents/OverSelection';
import PagerView from 'react-native-pager-view';
import SelectTeams from '../Flatlistcomponents/SelectTeams';
import StartmatchHeader from '../Headers/StartmatchHeader';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { routes } from '../../utils/routes';
import { setmatch } from '../../features/match/matchSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../../theme/themeContext';

const DATA = [
  { id: '1', title: '10 overs' },
  { id: '2', title: '20 overs' },
  { id: '3', title: '50 overs ' },
  { id: '4', title: 'Custom overs' },
];
const StartMatchPager = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useThemeContext();
  const dispatch = useDispatch();
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const [showTossPanel, setShowTossPanel] = useState(false);
  const [match, setMatch] = useState<MatchSetup>({
    matchId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    teamA: { id: 1, name: '', players: [] },
    teamB: { id: 2, name: '', players: [] },
    overs: null,
    electedTo: '',
    tossWinner: '',
    currentInnings: null,
    tossWinnerName: '',
    innings1: null,
    innings2: null,
    isCompleted: false,
    resultReason: 'NO_RESULT',
    winnerTeam: null,
    winnerTeamName: '',
  });

  useEffect(() => {
    const payload = route.params?.squadForTeam;
    if (!payload?.teamKey || !Array.isArray(payload.players)) return;

    const teamKey = payload.teamKey as 'teamA' | 'teamB';
    const players = payload.players as Player[];

    setMatch(prev => {
      const team = prev[teamKey];
      if (!team) return prev;
      const next: MatchSetup = {
        ...prev,
        [teamKey]: { ...team, players },
      };
      const a = next.teamA?.players?.length ?? 0;
      const b = next.teamB?.players?.length ?? 0;
      if (a > 0 && b > 0 && !next.tossWinner) {
        requestAnimationFrame(() => setShowTossPanel(true));
      }
      return next;
    });

    navigation.setParams({ squadForTeam: undefined });
  }, [route.params?.squadForTeam, navigation]);

  console.log('Current page:', page);
  console.log('Selected teams:', match);
  const pageTittle = (page: number) => {
    switch (page) {
      case 0:
        return 'Choose Match Format';
      case 1:
        return 'Name Your Teams';
      case 2:
        return 'Build Team Lineups';
      case 3:
        return 'Start Match';
      default:
        return 'Start Match';
    }
  };

  const onBack = () => {
    if (showTossPanel) {
      setShowTossPanel(false);
      return;
    }
    if (page > 0) {
      pagerRef.current?.setPage(page - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StartmatchHeader
        title={pageTittle(page)}
        onBack={onBack}
        steps={DATA}
        currentStep={page}
      />
      <PagerView
        style={[styles.pagerView]}
        initialPage={0}
        ref={pagerRef}
        scrollEnabled={false}
        onPageSelected={e => setPage(e.nativeEvent.position)}
      >
        <View
          key="0"
          style={[
            styles.page,
            { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
          ]}
        >
          <OverSelection
            onSelect={overs => {
              console.log('Selected overs:', overs);
              setMatch(prev => ({ ...prev, overs }));
              pagerRef.current?.setPage(1);
            }}
          />
        </View>
        <View
          key="1"
          style={[
            styles.page,
            { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
          ]}
        >
          <SelectTeams
            onSelect={teams => {
              setMatch(prev => ({
                ...prev,
                teamA: {
                  ...prev?.teamA!,
                  name: teams?.teamA,
                },
                teamB: {
                  ...prev?.teamB!,
                  name: teams?.teamB,
                },
              }));
              pagerRef.current?.setPage(2);
            }}
          />
        </View>
        <View
          key="2"
          style={[
            styles.page,
            { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
          ]}
        >
          <AddPlayers
            teamsSelected={match}
            showTossPanel={showTossPanel}
            onOpenToss={() => setShowTossPanel(true)}
            onCloseToss={() => setShowTossPanel(false)}
            onSelectToss={(tossWinner, electedTo) => {
              const tossWinnerName =
                tossWinner === 'teamA'
                  ? match?.teamA?.name ?? ''
                  : match?.teamB?.name ?? '';
              const battingTeam =
                electedTo === 'bat'
                  ? tossWinner
                  : tossWinner === 'teamA'
                  ? 'teamB'
                  : 'teamA';
              const bowlingTeam = battingTeam === 'teamA' ? 'teamB' : 'teamA';
              const initInnings = (
                battingTeam: 'teamA' | 'teamB',
                bowlingTeam: 'teamA' | 'teamB',
              ) => {
                const btName =
                  battingTeam === 'teamA'
                    ? match.teamA?.name ?? ''
                    : match.teamB?.name ?? '';
                const bwName =
                  bowlingTeam === 'teamA'
                    ? match.teamA?.name ?? ''
                    : match.teamB?.name ?? '';
                return {
                  battingTeam,
                  bowlingTeam,
                  battingTeamName: btName,
                  bowlingTeamName: bwName,
                  totalRuns: 0,
                  totalWickets: 0,
                  totalBalls: 0,
                  strikerId: null,
                  nonStrikerId: null,
                  bowlerId: null,
                  balls: [],
                  activeModal: null,
                  outTarget: 'STRIKER' as const,
                  pendingBowlerChange: false,
                  isCompleted: false,
                };
              };
              setMatch(prev => ({
                ...prev,
                tossWinner,
                electedTo,
                currentInnings: 1,
                tossWinnerName,
                innings1: initInnings(battingTeam, bowlingTeam),
                innings2: initInnings(bowlingTeam, battingTeam),
              }));
              setShowTossPanel(false);
              requestAnimationFrame(() => pagerRef.current?.setPage(3));
            }}
          />
        </View>
        <View
          key="3"
          style={[
            styles.page,
            { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
          ]}
        >
          <View style={{ flex: 1, width: '100%', marginTop: heightPixel(12) }}>
            <ThemeText color="text" style={styles.reviewTitle}>
              Ready to play
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.reviewSub}>
              Check details below, then go live.
            </ThemeText>
            <View
              style={[
                styles.reviewCard,
                {
                  backgroundColor: colors[isDark ? 'dark' : 'light'].surface,
                  borderColor: colors[isDark ? 'dark' : 'light'].border,
                },
              ]}
            >
              <View style={styles.reviewRow}>
                <ThemeText color="secondaryText" style={styles.reviewLabel}>
                  Format
                </ThemeText>
                <ThemeText color="text" style={styles.reviewValue}>
                  T{match.overs ?? '—'}
                </ThemeText>
              </View>
              <View style={styles.reviewRow}>
                <ThemeText color="secondaryText" style={styles.reviewLabel}>
                  Teams
                </ThemeText>
                <ThemeText color="text" style={styles.reviewValue}>
                  {match.teamA?.name} vs {match.teamB?.name}
                </ThemeText>
              </View>
              <View style={styles.reviewRow}>
                <ThemeText color="secondaryText" style={styles.reviewLabel}>
                  Toss
                </ThemeText>
                <ThemeText color="text" style={styles.reviewValue}>
                  {match.tossWinnerName} · {match.electedTo}
                </ThemeText>
              </View>
            </View>
            <Button
              title="Start match"
              onPress={() => {
                dispatch(setmatch(withGloballyUniquePlayerIds(match)));
                navigation.replace(routes.matchscoring as never);
              }}
            />
          </View>
        </View>
      </PagerView>
    </View>
  );
};

export default StartMatchPager;

const styles = StyleSheet.create({
  reviewTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(22),
    textAlign: 'center',
  },
  reviewSub: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    textAlign: 'center',
    marginTop: heightPixel(6),
    marginBottom: heightPixel(16),
  },
  reviewCard: {
    width: '100%',
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(16),
    marginBottom: heightPixel(16),
  },
  reviewRow: {
    marginBottom: heightPixel(12),
  },
  reviewLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reviewValue: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(15),
    marginTop: heightPixel(4),
  },
  textStyle: {
    marginTop: heightPixel(10),
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  desStyle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    marginTop: heightPixel(5),
  },
  pagerView: {
    flex: 1,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: widthPixel(5),
  },
  pageText: {
    fontSize: 20,
  },
});
