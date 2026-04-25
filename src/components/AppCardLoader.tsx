import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '../theme/themeContext';
import { fontFamilies } from '../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';

export type AppCardLoaderProps = {
  visible?: boolean;
  title?: string;
  subtitle?: string;
  fullWidth?: boolean;
  containerStyle?: any;
};

const cardColors = {
  goldSoft: '#FFE6A3',
  cream: '#FFF6DC',
  navy: '#082A5A',
  muted: '#5F6F7A',
  gold: '#D7A63D',
  blueDeep: '#021B3F',
  white: '#FFFFFF',
} as const;

const AppCardLoader = ({
  visible = true,
  title = 'Loading…',
  subtitle = 'Please wait while we prepare your data.',
  fullWidth = true,
  containerStyle,
}: AppCardLoaderProps) => {
  const { isDark } = useThemeContext();
  if (!visible) return null;

  const showTitle = !!title?.trim();
  const showSubtitle = !!subtitle?.trim();

  const bg = isDark ? 'rgba(2, 27, 63, 0.55)' : cardColors.cream;
  const border = isDark ? 'rgba(255, 230, 163, 0.18)' : 'rgba(214, 182, 90, 0.35)';
  const titleColor = isDark ? cardColors.white : cardColors.navy;
  const subColor = isDark ? 'rgba(255, 246, 220, 0.78)' : cardColors.muted;
  const spinner = isDark ? cardColors.goldSoft : cardColors.gold;
  const spinnerBg = isDark ? 'rgba(215,166,61,0.18)' : 'rgba(215,166,61,0.14)';

  return (
    <View style={[styles.wrap, fullWidth ? styles.full : null, containerStyle]}>
      <View
        style={[
          styles.card,
          !showTitle && !showSubtitle ? styles.cardCompact : null,
          { backgroundColor: bg, borderColor: border },
        ]}
      >
        <View style={[styles.row, !showTitle && !showSubtitle ? styles.rowCenterOnly : null]}>
          <View style={[styles.spinnerWrap, { backgroundColor: spinnerBg }]}>
            <ActivityIndicator size="small" color={spinner} />
          </View>
          {showTitle || showSubtitle ? (
            <View style={styles.textCol}>
              {showTitle ? (
                <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {showSubtitle ? (
                <Text style={[styles.subtitle, { color: subColor }]} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    marginTop: heightPixel(10),
    marginBottom: heightPixel(6),
  },
  full: { width: '100%' },
  card: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(18),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
    }),
  },
  cardCompact: {
    width: undefined,
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(12),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
  },
  rowCenterOnly: {
    justifyContent: 'center',
  },
  spinnerWrap: {
    width: widthPixel(40),
    height: widthPixel(40),
    borderRadius: widthPixel(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  subtitle: {
    marginTop: heightPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(16),
  },
});

export default AppCardLoader;

