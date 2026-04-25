import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';
import { colors } from '../../utils/colors';

type Theme = typeof colors.light;

type Props = {
  steps: readonly string[];
  activeIndex: number;
  isDark: boolean;
  theme: Theme;
};

const CreateTournamentStepper: React.FC<Props> = ({
  steps,
  activeIndex,
  isDark,
  theme,
}) => {
  const navy = theme.primary;
  const upcomingCircleBg = isDark ? theme.gray2 : theme.gray5;
  const upcomingNum = isDark ? theme.gray1 : theme.gray2;
  const upcomingLabel = theme.desText;
  const activeLabel = theme.text;
  const divider = theme.border;

  return (
    <View
      style={[
        styles.pill,
        isDark ? styles.pillShadowDark : styles.pillShadowLight,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {steps.map((label, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const upcoming = i > activeIndex;

        return (
          <React.Fragment key={`${label}-${i}`}>
            {i > 0 ? (
              <View style={[styles.vDivider, { backgroundColor: divider }]} />
            ) : null}
            <View style={styles.stepCell}>
              <View
                style={[
                  styles.circle,
                  done || active
                    ? { backgroundColor: navy }
                    : { backgroundColor: upcomingCircleBg },
                ]}
              >
                <Text
                  style={[
                    styles.circleGlyph,
                    done || active
                      ? styles.circleGlyphOn
                      : { color: upcomingNum },
                  ]}
                >
                  {done ? '✓' : String(i + 1)}
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={[
                  styles.stepLabel,
                  active
                    ? { color: activeLabel, fontFamily: fontFamilies.bold }
                    : {
                        color: upcoming ? upcomingLabel : activeLabel,
                        fontFamily: fontFamilies.medium,
                      },
                  done && !active ? { opacity: 0.85 } : null,
                ]}
              >
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  pillShadowLight: cardShadowSm(false),
  pillShadowDark: cardShadowSm(true),
  pill: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: widthPixel(16),
    borderWidth: 1,
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(6),
    marginBottom: heightPixel(18),
  },
  vDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: widthPixel(4),
    marginVertical: heightPixel(4),
  },
  stepCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: heightPixel(6),
    paddingHorizontal: widthPixel(2),
  },
  circle: {
    width: widthPixel(28),
    height: widthPixel(28),
    borderRadius: widthPixel(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleGlyph: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.bold,
  },
  circleGlyphOn: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: fontPixel(10),
    lineHeight: fontPixel(13),
    textAlign: 'center',
    width: '100%',
  },
});

export default CreateTournamentStepper;
