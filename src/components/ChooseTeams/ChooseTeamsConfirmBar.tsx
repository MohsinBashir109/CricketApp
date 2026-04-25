import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import ThemeText from '../ThemeText';
import { teamSlect } from '../../assets/images';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { colors } from '../../utils/colors';

type Theme = typeof colors.light;

type Props = {
  onPress: () => void;
  disabled: boolean;
  theme: Theme;
};

const ChooseTeamsConfirmBar: React.FC<Props> = ({ onPress, disabled, theme }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, heightPixel(14)),
          backgroundColor: 'transparent',
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: theme.primary,
            opacity: disabled ? 0.42 : pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.btnLeft}>
          <Image source={teamSlect} style={styles.shield} resizeMode="contain" tintColor="#FFFFFF" />
        </View>
        <ThemeText color="white" style={styles.btnText}>
          Confirm teams
        </ThemeText>
        <View style={styles.btnRight}>
          <Text style={[styles.arrow, { color: theme.onPrimary }]}>›</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: widthPixel(2),
    paddingTop: heightPixel(4),
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: heightPixel(54),
    borderRadius: widthPixel(16),
    paddingHorizontal: widthPixel(14),
  },
  btnLeft: {
    width: widthPixel(36),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  btnRight: {
    width: widthPixel(36),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  shield: {
    width: widthPixel(24),
    height: widthPixel(24),
  },
  btnText: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.semibold,
    paddingHorizontal: widthPixel(4),
  },
  arrow: {
    fontSize: fontPixel(26),
    fontFamily: fontFamilies.bold,
    marginTop: -heightPixel(2),
  },
});

export default ChooseTeamsConfirmBar;
