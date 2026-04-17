import { Animated, Easing, StyleSheet, View } from 'react-native';
import React, { useEffect, useMemo, useRef } from 'react';

import { colors } from '../../utils/colors';
import { useThemeContext } from '../../theme/themeContext';
import { heightPixel, widthPixel } from '../../utils/constants';

interface Step {
  id: string;
  title: string;
}

interface Props {
  steps: Step[];
  currentStep: number; // 0-based index
}

/** Segmented pager indicator: compact gray capsules; active step expands into a green pill. */
const DashesProgressBar = (props: Props) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const segmentH = heightPixel(5);
  const segmentGap = widthPixel(6);

  const inactiveColor = theme.gray4;
  const activeColor = theme.primary;

  const progress = useRef(new Animated.Value(props.currentStep)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: props.currentStep,
      duration: 340,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [props.currentStep, progress]);

  const segmentAnims = useMemo(() => {
    const narrow = widthPixel(10);
    const wide = widthPixel(34);
    return props.steps.map((_, i) => ({
      widthAnim: progress.interpolate({
        inputRange: [i - 1, i, i + 1],
        outputRange: [narrow, wide, narrow],
        extrapolate: 'clamp',
      }),
      opacityAnim: progress.interpolate({
        inputRange: [i - 1, i, i + 1],
        outputRange: [0.45, 1, 0.45],
        extrapolate: 'clamp',
      }),
      colorAnim: progress.interpolate({
        inputRange: [i - 1, i, i + 1],
        outputRange: [inactiveColor, activeColor, inactiveColor],
        extrapolate: 'clamp',
      }),
    }));
  }, [props.steps, progress, inactiveColor, activeColor]);

  return (
    <View style={[styles.row, { gap: segmentGap }]}>
      {props.steps.map((step, i) => {
        const { widthAnim, opacityAnim, colorAnim } = segmentAnims[i];
        return (
          <Animated.View
            key={step.id}
            accessibilityRole="none"
            accessibilityLabel={`Step ${i + 1} of ${props.steps.length}`}
            accessibilityState={{ selected: i === props.currentStep }}
            style={[
              styles.segment,
              {
                height: segmentH,
                borderRadius: segmentH / 2,
                width: widthAnim,
                opacity: opacityAnim,
                backgroundColor: colorAnim,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default DashesProgressBar;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(2),
    paddingBottom: heightPixel(14),
  },
  segment: {
    overflow: 'hidden',
  },
});
