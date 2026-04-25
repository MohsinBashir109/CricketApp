import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';
import { useThemeContext } from '../theme/themeContext';
import ThemeText from './ThemeText';
import { cardShadowSm } from '../utils/cardShadow';
import { fixturecard, matches } from '../assets/images';

type MatchCardProps = {
  teamAName?: string;
  teamBName?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  matchTypeLabel?: string | null;
  statusLabel?: string | null;
  progressPct?: number | null; // 0..100
  /** Optional art background (same asset as tournament history). */
  artBackground?: boolean;
  /** `primary` = blue (single-match history). `gold` = trophy accent (tournament). */
  artAccent?: 'primary' | 'gold';
};

const clampPct = (v: number) => Math.max(0, Math.min(100, v));

const MatchCard = ({
  teamAName,
  teamBName,
  onPress,
  children,
  matchTypeLabel,
  statusLabel,
  progressPct,
  artBackground = false,
  artAccent = 'primary',
}: MatchCardProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const pct = typeof progressPct === 'number' ? clampPct(progressPct) : null;
  const gold = theme.accent;
  const useGold = artBackground && artAccent === 'gold';
  const iconBg = useGold
    ? isDark
      ? 'rgba(215,166,61,0.18)'
      : 'rgba(215,166,61,0.2)'
    : theme.primaryMuted;
  const iconTint = useGold ? gold : theme.primary;
  const statusPillBg = useGold
    ? isDark
      ? 'rgba(215,166,61,0.2)'
      : 'rgba(215,166,61,0.22)'
    : theme.primaryMuted;
  const progressFill = useGold ? gold : theme.primary;
  const scrimColor = isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.28)';

  const row = (
    <>
      <View style={styles.headerRow}>
        <View style={[styles.leadingIconWrap, { backgroundColor: iconBg }]}>
          <Image source={matches} style={[styles.leadingIcon, { tintColor: iconTint }]} />
        </View>

        <View style={styles.headerTextCol}>
          <ThemeText color="text" style={styles.title} numberOfLines={1}>
            {(teamAName || '-') + ' vs ' + (teamBName || '-')}
          </ThemeText>
          {matchTypeLabel ? (
            <ThemeText color="secondaryText" style={styles.subTitle} numberOfLines={1}>
              {matchTypeLabel}
            </ThemeText>
          ) : null}
        </View>

        <View style={styles.headerRightCol}>
          {statusLabel ? (
            <View style={[styles.statusPill, { backgroundColor: statusPillBg }]}>
              {useGold ? (
                <Text style={[styles.statusPillText, { color: gold }]} numberOfLines={1}>
                  {statusLabel}
                </Text>
              ) : (
                <ThemeText color="primary" style={styles.statusPillText} numberOfLines={1}>
                  {statusLabel}
                </ThemeText>
              )}
            </View>
          ) : null}
          <ThemeText color="secondaryText" style={styles.chevron}>
            ›
          </ThemeText>
        </View>
      </View>

      {children ? <View style={styles.body}>{children}</View> : null}

      {pct != null ? (
        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: theme.gray3 }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: progressFill, width: `${pct}%` as any },
              ]}
            />
          </View>
          <ThemeText color="secondaryText" style={styles.progressText}>
            {Math.round(pct)}%
          </ThemeText>
        </View>
      ) : null}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardShadowDark : styles.cardShadowLight,
        {
          backgroundColor: artBackground ? 'transparent' : theme.surface,
          borderColor: theme.border,
          opacity: pressed && onPress ? 0.94 : 1,
        },
      ]}
    >
      {artBackground ? (
        <View style={styles.artInner}>
          <Image source={fixturecard} style={styles.artBg} resizeMode="cover" />
          <View
            style={[StyleSheet.absoluteFillObject, { backgroundColor: scrimColor }]}
            pointerEvents="none"
          />
          <View style={styles.artContent}>{row}</View>
        </View>
      ) : (
        <View style={styles.cardPadding}>{row}</View>
      )}
    </Pressable>
  );
};

export default MatchCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: heightPixel(12),
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    overflow: 'hidden',
  },
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  cardPadding: {
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(14),
  },
  artInner: {
    width: '100%',
    borderRadius: widthPixel(15),
    overflow: 'hidden',
  },
  artBg: {
    ...StyleSheet.absoluteFillObject,
  },
  artContent: {
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(14),
    position: 'relative',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
  },
  leadingIconWrap: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingIcon: {
    width: widthPixel(22),
    height: widthPixel(22),
    resizeMode: 'contain',
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  subTitle: {
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(16),
  },
  headerRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: heightPixel(6),
  },
  statusPill: {
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(999),
  },
  statusPillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  chevron: {
    marginTop: heightPixel(-2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(18),
  },
  body: {
    marginTop: heightPixel(10),
  },
  progressRow: {
    marginTop: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(10),
  },
  progressTrack: {
    flex: 1,
    height: heightPixel(6),
    borderRadius: widthPixel(999),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: widthPixel(999),
  },
  progressText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
});

