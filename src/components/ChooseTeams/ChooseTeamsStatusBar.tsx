import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import ThemeText from '../ThemeText';
import { players } from '../../assets/images';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import type { colors } from '../../utils/colors';

type Theme = typeof colors.light;

type Props = {
  selected: number;
  total: number;
  isComplete: boolean;
  theme: Theme;
  isDark: boolean;
};

const ChooseTeamsStatusBar: React.FC<Props> = ({
  selected,
  total,
  isComplete,
  theme,
  isDark,
}) => {
  const remaining = Math.max(0, total - selected);
  const progressPill =
    isComplete ? (
      <View
        style={[
          styles.pill,
          { backgroundColor: isDark ? 'rgba(52,211,153,0.18)' : '#E7F7EE' },
        ]}
      >
        <ThemeText color="green" style={styles.pillText}>
          ✓ All teams selected
        </ThemeText>
      </View>
    ) : remaining > 0 ? (
      <View style={[styles.pillMuted, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
        <ThemeText color="secondaryText" style={styles.pillMutedText} numberOfLines={1}>
          {remaining === 1 ? '1 more needed' : `${remaining} more needed`}
        </ThemeText>
      </View>
    ) : null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.primaryMuted,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <Image
            source={players}
            style={styles.peopleIcon}
            resizeMode="contain"
            tintColor={theme.extras}
          />
          <Text style={styles.countLine}>
            <Text style={[styles.countMuted, { color: theme.secondaryText }]}>Selected </Text>
            <Text style={[styles.countNum, { color: theme.extras }]}>{selected}</Text>
            <Text style={[styles.countMuted, { color: theme.secondaryText }]}> of </Text>
            <Text style={[styles.countNum, { color: theme.extras }]}>{total}</Text>
          </Text>
        </View>
        {progressPill}
      </View>
      <ThemeText color="secondaryText" style={styles.hint}>
        Save, and you will return here with your selection.
      </ThemeText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: heightPixel(12),
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(10),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(10),
    flex: 1,
    minWidth: 0,
    paddingRight: widthPixel(6),
  },
  peopleIcon: {
    width: widthPixel(24),
    height: widthPixel(24),
  },
  countLine: {
    flex: 1,
    flexWrap: 'wrap',
  },
  countMuted: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.medium,
  },
  countNum: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.bold,
  },
  pill: {
    flexShrink: 0,
    paddingVertical: heightPixel(7),
    paddingHorizontal: widthPixel(11),
    borderRadius: widthPixel(999),
  },
  pillMuted: {
    flexShrink: 0,
    maxWidth: '46%',
    paddingVertical: heightPixel(7),
    paddingHorizontal: widthPixel(10),
    borderRadius: widthPixel(999),
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillMutedText: {
    fontSize: fontPixel(11),
    fontFamily: fontFamilies.semibold,
  },
  pillText: {
    fontSize: fontPixel(11),
    fontFamily: fontFamilies.semibold,
  },
  hint: {
    marginTop: heightPixel(10),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
});

export default ChooseTeamsStatusBar;
