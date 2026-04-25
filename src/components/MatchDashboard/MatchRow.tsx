import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import StatusBadge from '../TournamentDashboard/StatusBadge';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';

export type MatchRowProps = {
  title: string;
  subtitle: string;
  leftIcon: any;
  leftIconTint: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  progressPct: number; // 0..100
  progressTrackColor: string;
  borderColor: string;
  backgroundColor: string;
  isDark?: boolean;
  onPress: () => void;
};

const clampPct = (v: number) => Math.max(0, Math.min(100, v));

const MatchRow = ({
  title,
  subtitle,
  leftIcon,
  leftIconTint,
  statusLabel,
  statusBg,
  statusFg,
  progressPct,
  progressTrackColor,
  borderColor,
  backgroundColor,
  isDark = false,
  onPress,
}: MatchRowProps) => {
  const pct = clampPct(progressPct);

  return (
    <View
      style={[
        styles.rowOuter,
        isDark ? styles.rowShadowDark : styles.rowShadowLight,
        { borderColor, backgroundColor },
      ]}
    >
      <Pressable onPress={onPress} style={styles.row}>
        <View style={styles.rowTop}>
          <View style={styles.rowLeft}>
            <View style={styles.iconTile}>
              <Image
                source={leftIcon}
                style={[styles.iconImg, { tintColor: leftIconTint }]}
              />
            </View>
            <View style={styles.textCol}>
              <ThemeText color="text" style={styles.title} numberOfLines={1}>
                {title}
              </ThemeText>
              <ThemeText
                color="secondaryText"
                style={styles.subtitle}
                numberOfLines={1}
              >
                {subtitle}
              </ThemeText>
            </View>
          </View>

          <View style={styles.rowRight}>
            <StatusBadge
              label={statusLabel}
              backgroundColor={statusBg}
              color={statusFg}
            />
            <ThemeText color="secondaryText" style={styles.chevron}>
              ›
            </ThemeText>
          </View>
        </View>

        <View style={styles.rowBottom}>
          <View style={[styles.progressTrack, { backgroundColor: progressTrackColor }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: statusFg, width: `${pct}%` as any },
              ]}
            />
          </View>
          <ThemeText color="secondaryText" style={[styles.percent, { color: statusFg }]}>
            {Math.round(pct)}%
          </ThemeText>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  rowOuter: {
    borderWidth: 1,
    borderRadius: widthPixel(16),
  },
  rowShadowLight: cardShadowSm(false),
  rowShadowDark: cardShadowSm(true),
  row: {
    borderRadius: widthPixel(16),
    padding: widthPixel(12),
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(10),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(10),
    flex: 1,
    minWidth: 0,
  },
  iconTile: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    backgroundColor: '#0B1D3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImg: {
    width: widthPixel(24),
    height: widthPixel(24),
    resizeMode: 'contain',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  subtitle: {
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
    lineHeight: fontPixel(14),
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(8),
  },
  chevron: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(18),
    marginTop: -heightPixel(2),
  },
  rowBottom: {
    marginTop: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(10),
  },
  progressTrack: {
    flex: 1,
    height: heightPixel(7),
    borderRadius: widthPixel(999),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: widthPixel(999),
  },
  percent: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
});

export default MatchRow;

