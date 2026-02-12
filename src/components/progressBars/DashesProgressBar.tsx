import { Animated, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useMemo, useRef } from 'react';

import { FlatList } from 'react-native/Libraries/Lists/FlatList';

interface Step {
  id: string;
  title: string;
}

interface Props {
  steps: Step[];
  currentStep: number; // 0-based index
}

const DashesProgressBar = (props: Props) => {
  const dashWidth = 42;
  const dashHeight = 6;
  const dashGap = 10;
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: props.currentStep,
      duration: 280,
      useNativeDriver: false, // we animate width/color etc.
    }).start();
  }, [props.currentStep, progress]);

  const dashFillWidths = useMemo(() => {
    return props.steps.map((_, i) => {
      // For each dash, fill = clamp(progress - i, 0..1) * dashWidth
      return progress.interpolate({
        inputRange: [i, i + 1],
        outputRange: [0, dashWidth],
        extrapolate: 'clamp',
      });
    });
  }, [props.steps, progress, dashWidth]);

  return (
    <View style={[styles.row, { columnGap: dashGap }]}>
      {props.steps.map((step, i) => {
        const isActive = i === props.currentStep;

        return (
          <View key={step.id} style={{ alignItems: 'center' }}>
            {/* Dash container (outlined / dashed look) */}
            <View
              style={[
                styles.dashOuter,
                {
                  width: dashWidth,
                  height: dashHeight,
                  borderRadius: dashHeight / 2,
                },
              ]}
            >
              {/* Filled part */}
              <Animated.View
                style={[
                  styles.dashFill,
                  {
                    width: dashFillWidths[i],
                    height: dashHeight,
                    borderRadius: dashHeight / 2,
                  },
                ]}
              />
            </View>

            {/* Label */}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {step.title}
            </Text>
          </View>
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
  },
  dashOuter: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  dashFill: {
    backgroundColor: 'white',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  labelActive: {
    color: 'white',
  },
});
