import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import StatusBadge from './StatusBadge';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { useThemeContext } from '../../theme/themeContext';

const TORN_CARD = require('../../assets/images/tornamentcard.png');

export type TournamentRowProps = {
  title: string;
  subtitle: string;
  leftIcon: any;
  leftIconTint: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  progressPct: number; // 0..100
  progressTrackColor: string;
  onPress: () => void;
  /** Tournaments home: active tournament preview row uses the same art as history cards. */
  artBackground?: boolean;
};

const clampPct = (v: number) => Math.max(0, Math.min(100, v));

const TournamentRow = ({
  title,
  subtitle,
  leftIcon,
  leftIconTint,
  statusLabel,
  statusBg,
  statusFg,
  progressPct,
  progressTrackColor,
  onPress,
  artBackground = false,
}: TournamentRowProps) => {
  const { isDark } = useThemeContext();
  const pct = clampPct(progressPct);
  const scrim = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)';
  const artTitleColor = artBackground ? '#FFFFFF' : undefined;
  const artSubColor = artBackground ? 'rgba(255,255,255,0.82)' : undefined;
  const artChevronColor = artBackground ? 'rgba(255,255,255,0.75)' : undefined;

  const main = (
    <View>
      <View style={styles.rowTop}>
        <View style={styles.rowLeft}>
          <View style={styles.iconTile}>
            <Image
              source={leftIcon}
              style={[styles.iconImg, { tintColor: leftIconTint }]}
            />
          </View>
          <View style={styles.textCol}>
            <ThemeText
              color="text"
              style={[styles.title, artTitleColor ? { color: artTitleColor } : null]}
              numberOfLines={1}
            >
              {title}
            </ThemeText>
            <ThemeText
              color="secondaryText"
              style={[styles.subtitle, artSubColor ? { color: artSubColor } : null]}
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
          <ThemeText
            color="secondaryText"
            style={[styles.chevron, artChevronColor ? { color: artChevronColor } : null]}
          >
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
    </View>
  );

  if (artBackground) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, styles.rowArt, { opacity: pressed ? 0.95 : 1 }]}
      >
        <Image source={TORN_CARD} style={styles.rowArtImage} resizeMode="cover" />
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: scrim }]}
          pointerEvents="none"
        />
        <View style={styles.rowArtContent}>{main}</View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.row}>
      {main}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    borderRadius: widthPixel(16),
    padding: widthPixel(12),
  },
  rowArt: {
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  rowArtImage: {
    ...StyleSheet.absoluteFillObject,
  },
  rowArtContent: {
    position: 'relative',
    zIndex: 1,
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

export default TournamentRow;
