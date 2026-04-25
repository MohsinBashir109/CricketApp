import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { backarrow, pause, play } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../../theme/themeContext';

interface Score {
  innings?: any;
  tossWinnerName?: string;
  overs?: string;
  innings1?: any;
  currentInnings?: number;
  /** Optional override for target display (e.g. Super Over chase target = SO1 + 1). */
  targetRuns?: number | null;
  isPaused?: boolean;
  onTogglePause?: () => void;
  onOpenMatchSettings?: () => void;
  onOpenSummary?: () => void;
  computed?: any;
}

const ballsToOvers = (balls: number) =>
  `${Math.floor(balls / 6)}.${balls % 6}`;

const ballsToOversDecimal = (balls: number) =>
  Math.floor(balls / 6) + (balls % 6) / 6;

const formatThisOverBall = (b: any) => {
  if (b?.wicket) return 'W';
  if (b?.extra === 'wide') return `Wd${Math.max(Number(b?.runs ?? 1), 1)}`;
  if (b?.extra === 'noball') return `Nb${Math.max(Number(b?.runs ?? 1), 1)}`;
  if (b?.extra === 'bye') return `B${b?.runs || 1}`;
  if (b?.extra === 'legbye') return `Lb${b?.runs || 1}`;
  return b?.runs === 0 ? '•' : String(b?.runs ?? 0);
};

const ScoringHeader = ({
  innings,
  tossWinnerName,
  overs,
  innings1,
  currentInnings,
  targetRuns,
  isPaused = false,
  onTogglePause,
  onOpenMatchSettings,
  onOpenSummary,
  computed,
}: Score) => {
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const displayTotalBalls = computed?.totals?.totalLegalBalls ?? innings.totalBalls;
  const displayTotalRuns = computed?.totals?.totalRuns ?? innings.totalRuns;
  const displayWickets = computed?.totals?.totalWickets ?? innings.totalWickets;

  const oversBowledText = ballsToOvers(displayTotalBalls);
  const oversLimitText = `${overs}`;
  const oversDecimal = ballsToOversDecimal(displayTotalBalls);
  const crr =
    oversDecimal > 0 ? (displayTotalRuns / oversDecimal).toFixed(2) : '0.00';

  const thisOverChips = React.useMemo(() => {
    const totalBalls = innings?.totalBalls ?? 0;
    const currentOverNumber = Math.floor(totalBalls / 6) + 1;
    const balls = innings?.balls ?? [];
    return balls.filter((b: any) => b?.over === currentOverNumber);
  }, [innings?.balls, innings?.totalBalls]);

  const statusBarStyle =
    isDark && theme.primary === '#3DDC9C' ? 'dark-content' : 'light-content';

  return (
    <LinearGradient
      colors={theme.tabGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={statusBarStyle}
      />

      <View
        style={[
          styles.innercontainer,
          {
            paddingTop:
              Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 52,
          },
        ]}
      >
        <View style={styles.toolbar}>
          <Pressable hitSlop={16} onPress={() => navigation.goBack()}>
            <Image
              source={backarrow}
              style={styles.iconBtn}
              tintColor={theme.white}
            />
          </Pressable>
          <View style={styles.toolbarCenter}>
            <View
              style={[
                styles.livePill,
                { backgroundColor: 'rgba(255,255,255,0.22)' },
              ]}
            >
              <ThemeText style={styles.liveText} color="white">
                {isPaused ? 'PAUSED' : 'LIVE'}
              </ThemeText>
            </View>
            <ThemeText style={styles.formatText} color="white">
              T{overs}
            </ThemeText>
          </View>
          <View style={styles.toolbarRight}>
            {onOpenSummary ? (
              <Pressable hitSlop={16} onPress={() => onOpenSummary()}>
                <ThemeText style={styles.summaryIcon} color="white">
                  ⎘
                </ThemeText>
              </Pressable>
            ) : null}
            {onOpenMatchSettings ? (
              <Pressable hitSlop={16} onPress={() => onOpenMatchSettings()}>
                <ThemeText style={styles.gearIcon} color="white">
                  ⚙
                </ThemeText>
              </Pressable>
            ) : null}
            <Pressable hitSlop={16} onPress={() => onTogglePause?.()}>
              <Image
                source={isPaused ? play : pause}
                style={styles.iconBtn}
                tintColor={theme.white}
              />
            </Pressable>
          </View>
        </View>

        <ThemeText style={styles.battingTeam} color="white" numberOfLines={1}>
          {innings.battingTeamName}
        </ThemeText>

        <View style={styles.scoreBlock}>
          <View>
            <ThemeText style={styles.megaRuns} color="white">
              {displayTotalRuns}
              <ThemeText style={styles.slashWkts} color="white">
                {' '}
                / {displayWickets}
              </ThemeText>
            </ThemeText>
            <ThemeText style={styles.inningsChip} color="white">
              Innings {currentInnings ?? 1}
            </ThemeText>
          </View>
          <View style={styles.oversBlock}>
            <ThemeText style={styles.oversValue} color="white">
              {oversBowledText}
              <ThemeText style={styles.oversCap} color="white">
                /{oversLimitText}
              </ThemeText>
            </ThemeText>
            <ThemeText style={styles.crr} color="white">
              CRR {crr}
            </ThemeText>
          </View>
        </View>

        <View style={styles.targetRow}>
          {((currentInnings === 2 || currentInnings === 4) && innings1?.isCompleted) ? (
            <ThemeText style={styles.targetText} color="white">
              Target {typeof targetRuns === 'number' ? targetRuns : (Number(innings1?.totalRuns ?? 0) + 1)}
            </ThemeText>
          ) : (
            <ThemeText style={styles.targetText} color="white">
              This over
            </ThemeText>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.overChipsRow}
          >
            {thisOverChips.map((b: any, idx: number) => (
              <View key={`${b?.over ?? 'o'}-${idx}`} style={styles.overChip}>
                <ThemeText style={styles.overChipText} color="white">
                  {formatThisOverBall(b)}
                </ThemeText>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );
};

export default ScoringHeader;

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
  },
  innercontainer: {
    paddingHorizontal: widthPixel(18),
    paddingBottom: heightPixel(16),
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: heightPixel(10),
  },
  iconBtn: {
    width: widthPixel(22),
    height: heightPixel(22),
  },
  toolbarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(10),
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(14),
  },
  summaryIcon: {
    fontSize: fontPixel(18),
    lineHeight: fontPixel(22),
    opacity: 0.95,
  },
  gearIcon: {
    fontSize: fontPixel(20),
    lineHeight: fontPixel(22),
    opacity: 0.95,
  },
  livePill: {
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(4),
    borderRadius: widthPixel(8),
  },
  liveText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(11),
    letterSpacing: 1,
  },
  formatText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
    opacity: 0.95,
  },
  battingTeam: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(15),
    opacity: 0.92,
    marginBottom: heightPixel(6),
  },
  scoreBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  megaRuns: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(44),
    letterSpacing: -1,
  },
  slashWkts: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(26),
    opacity: 0.9,
  },
  inningsChip: {
    marginTop: heightPixel(6),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    opacity: 0.85,
  },
  oversBlock: {
    alignItems: 'flex-end',
  },
  oversValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(26),
  },
  oversCap: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(18),
    opacity: 0.85,
  },
  crr: {
    marginTop: heightPixel(4),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    opacity: 0.9,
  },
  targetRow: {
    marginTop: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
    opacity: 0.95,
  },
  overChipsRow: {
    gap: widthPixel(8),
    paddingLeft: widthPixel(12),
    paddingRight: widthPixel(2),
    alignItems: 'center',
  },
  overChip: {
    paddingHorizontal: widthPixel(2),
  },
  overChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
  },
});
