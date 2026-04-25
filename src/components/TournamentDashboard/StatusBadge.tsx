import React from 'react';
import { StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

type StatusBadgeProps = {
  label: string;
  backgroundColor: string;
  color: string;
};

const StatusBadge = ({ label, backgroundColor, color }: StatusBadgeProps) => {
  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <ThemeText color="text" style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </ThemeText>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(999),
  },
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
  },
});

export default StatusBadge;

