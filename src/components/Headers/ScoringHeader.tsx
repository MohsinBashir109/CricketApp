import {
  Image,
  Platform,
  Pressable,
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
  isPaused?: boolean;
  onTogglePause?: () => void;
}

const ballsToOvers = (balls: number) =>
  `${Math.floor(balls / 6)}.${balls % 6}`;

const ballsToOversDecimal = (balls: number) =>
  Math.floor(balls / 6) + (balls % 6) / 6;

const ScoringHeader = ({
  innings,
  tossWinnerName,
  overs,
  innings1,
  currentInnings,
  isPaused = false,
  onTogglePause,
}: Score) => {
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const oversBowledText = ballsToOvers(innings.totalBalls);
  const oversLimitText = `${overs}`;
  const oversDecimal = ballsToOversDecimal(innings.totalBalls);
  const crr =
    oversDecimal > 0 ? (innings.totalRuns / oversDecimal).toFixed(2) : '0.00';

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
          <Pressable hitSlop={16} onPress={() => onTogglePause?.()}>
            <Image
              source={isPaused ? play : pause}
              style={styles.iconBtn}
              tintColor={theme.white}
            />
          </Pressable>
        </View>

        <ThemeText style={styles.battingTeam} color="white" numberOfLines={1}>
          {innings.battingTeamName}
        </ThemeText>

        <View style={styles.scoreBlock}>
          <View>
            <ThemeText style={styles.megaRuns} color="white">
              {innings.totalRuns}
              <ThemeText style={styles.slashWkts} color="white">
                {' '}
                / {innings.totalWickets}
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

        {innings1?.isCompleted && (
          <View style={styles.targetRow}>
            <ThemeText style={styles.targetText} color="white">
              Target {innings1?.totalRuns}
            </ThemeText>
          </View>
        )}
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
  },
  targetText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
    opacity: 0.95,
  },
});
