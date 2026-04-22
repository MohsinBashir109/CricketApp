import { Pressable, StyleSheet, View } from 'react-native';
import React, { useMemo, useState } from 'react';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';

import { MatchSetup } from '../../types/Playertype';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

interface TossProps {
  onSelect?: (tossWinner: 'teamA' | 'teamB', electedTo: 'bat' | 'bowl') => void;
  match?: MatchSetup;
  compact?: boolean;
  onClose?: () => void;
}

type Step = 'winner' | 'choice';

const initialsFromName = (name: string) => {
  const t = (name ?? '').trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
};

const Toss = ({ onSelect, match, compact = false, onClose }: TossProps) => {
  const [step, setStep] = useState<Step>('winner');
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB' | null>(null);
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const teamAName = match?.teamA?.name || 'Team A';
  const teamBName = match?.teamB?.name || 'Team B';

  const winnerName =
    tossWinner === 'teamA'
      ? match?.teamA?.name
      : tossWinner === 'teamB'
        ? match?.teamB?.name
        : '';

  const winnerInitials = useMemo(
    () => initialsFromName(winnerName || ''),
    [winnerName],
  );

  const pickWinner = (team: 'teamA' | 'teamB') => {
    setTossWinner(team);
    setStep('choice');
  };

  const finish = (electedTo: 'bat' | 'bowl') => {
    if (!tossWinner) return;
    onSelect?.(tossWinner, electedTo);
  };

  const goBack = () => {
    setStep('winner');
    setTossWinner(null);
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {compact ? <View style={styles.handle} /> : null}
      {step === 'winner' ? (
        <>
          <View style={styles.headerBlock}>
            <ThemeText color="text" style={styles.title}>
              Who won the toss?
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.sub}>
              Tap the team that won the toss. You&apos;ll choose bat or bowl next
              — no popups.
            </ThemeText>
          </View>

          <View
            style={[
              styles.card,
              isDark ? styles.cardShadowDark : styles.cardShadowLight,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <ThemeText color="secondaryText" style={styles.cardLabel}>
              Teams
            </ThemeText>

            <Pressable
              onPress={() => pickWinner('teamA')}
              style={({ pressed }) => [
                styles.teamRow,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <ThemeText color="white" style={styles.badgeText}>
                  {initialsFromName(teamAName)}
                </ThemeText>
              </View>
              <View style={styles.teamMeta}>
                <ThemeText color="text" style={styles.teamName} numberOfLines={1}>
                  {teamAName}
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.teamHint}>
                  Tap to set as toss winner
                </ThemeText>
              </View>
              <ThemeText color="secondaryText" style={styles.chev}>
                ›
              </ThemeText>
            </Pressable>

            <Pressable
              onPress={() => pickWinner('teamB')}
              style={({ pressed }) => [
                styles.teamRow,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <ThemeText color="white" style={styles.badgeText}>
                  {initialsFromName(teamBName)}
                </ThemeText>
              </View>
              <View style={styles.teamMeta}>
                <ThemeText color="text" style={styles.teamName} numberOfLines={1}>
                  {teamBName}
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.teamHint}>
                  Tap to set as toss winner
                </ThemeText>
              </View>
              <ThemeText color="secondaryText" style={styles.chev}>
                ›
              </ThemeText>
            </Pressable>
          </View>
        </>
      ) : (
        <View
          style={[
            styles.card,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.winnerRow}>
            <View style={[styles.badgeLg, { backgroundColor: theme.primary }]}>
              <ThemeText color="white" style={styles.badgeTextLg}>
                {winnerInitials}
              </ThemeText>
            </View>
            <View style={styles.winnerMeta}>
              <ThemeText color="text" style={styles.choiceTitle} numberOfLines={2}>
                {winnerName} won the toss
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.choiceSub}>
                What did they elect to do?
              </ThemeText>
            </View>
          </View>

          <View style={styles.choiceRow}>
            <Pressable
              onPress={() => finish('bat')}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.primary },
                pressed && styles.actionPressed,
              ]}
            >
              <ThemeText color="white" style={styles.actionText}>
                Bat
              </ThemeText>
            </Pressable>
            <Pressable
              onPress={() => finish('bowl')}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.primary },
                pressed && styles.actionPressed,
              ]}
            >
              <ThemeText color="white" style={styles.actionText}>
                Bowl
              </ThemeText>
            </Pressable>
          </View>

          <Pressable onPress={goBack} hitSlop={12} style={styles.backLink}>
            <ThemeText color="primary" style={styles.backText}>
              ← Change toss winner
            </ThemeText>
          </Pressable>
          {compact && onClose ? (
            <Pressable onPress={onClose} hitSlop={12} style={styles.cancelLink}>
              <ThemeText color="secondaryText" style={styles.cancelText}>
                Close
              </ThemeText>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default Toss;

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  container: {
    width: '100%',
    marginTop: heightPixel(20),
  },
  containerCompact: {
    marginTop: 0,
  },
  handle: {
    alignSelf: 'center',
    width: widthPixel(44),
    height: heightPixel(4),
    borderRadius: widthPixel(999),
    backgroundColor: '#D6DDD9',
    marginTop: heightPixel(4),
    marginBottom: heightPixel(12),
  },
  headerBlock: {
    paddingHorizontal: widthPixel(10),
    marginBottom: heightPixel(20),
  },
  title: {
    fontSize: fontPixel(22),
    fontFamily: fontFamilies.bold,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.regular,
    marginTop: heightPixel(6),
    lineHeight: fontPixel(20),
  },
  card: {
    width: '100%',
    borderRadius: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(14),
  },
  cardLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: heightPixel(10),
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
    marginBottom: heightPixel(10),
  },
  pressed: { opacity: 0.92 },
  badge: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
    letterSpacing: 0.6,
  },
  teamMeta: {
    flex: 1,
    marginLeft: widthPixel(12),
    minWidth: 0,
  },
  teamName: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  teamHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    marginTop: heightPixel(4),
  },
  chev: {
    fontSize: fontPixel(20),
    marginTop: -heightPixel(2),
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: heightPixel(14),
  },
  badgeLg: {
    width: widthPixel(52),
    height: widthPixel(52),
    borderRadius: widthPixel(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTextLg: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    letterSpacing: 0.6,
  },
  winnerMeta: {
    flex: 1,
    marginLeft: widthPixel(12),
  },
  choiceTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  choiceSub: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    marginTop: heightPixel(6),
  },
  choiceRow: {
    flexDirection: 'row',
    gap: widthPixel(12),
    marginTop: heightPixel(14),
  },
  actionBtn: {
    flex: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(16),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  actionPressed: { opacity: 0.92 },
  actionText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  backLink: {
    marginTop: heightPixel(16),
    alignSelf: 'center',
    paddingVertical: heightPixel(8),
  },
  backText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: heightPixel(8),
  },
  cancelText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
});
