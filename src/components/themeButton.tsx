import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fontFamilies, globalStyles } from '../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';

import React from 'react';
import { colors } from '../utils/colors';
import { useThemeContext } from '../theme/themeContext';
import { elevation } from '../utils/elevation';

interface ButtonProps {
  title: string;
  buttonStyle?: any;
  bgColor?: keyof typeof colors.light | keyof typeof colors.dark | string;
  textColor?: keyof typeof colors.light | keyof typeof colors.dark | string;
  titleStyle?: any;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  rightIcon?: any;
  leftIcon?: any;
  lefticonStyle?: any;
  righticonStyle?: any;
  leftIconTintColor?: string;
  rightIconTintColor?: string;
}

const Button = (props: ButtonProps) => {
  const {
    title,
    buttonStyle,
    titleStyle,
    onPress,
    disabled,
    loading,
    rightIcon,
    leftIcon,
    bgColor,
    textColor,
    lefticonStyle,
    righticonStyle,
    leftIconTintColor,
    rightIconTintColor,
  } = props;
  const { isDark } = useThemeContext();

  const isDisabled = !!disabled || !!loading;
  const resolvedBg = isDark
    ? colors.dark[bgColor ? (bgColor as keyof typeof colors.dark) : 'primary']
    : colors.light[bgColor ? (bgColor as keyof typeof colors.light) : 'primary'];
  const resolvedText = isDark
    ? colors.dark[textColor ? (textColor as keyof typeof colors.dark) : 'white']
    : colors.light[textColor ? (textColor as keyof typeof colors.light) : 'white'];

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        buttonStyle,
        { backgroundColor: resolvedBg },
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled
          ? {
              backgroundColor: isDark ? colors.dark.gray1 : colors.light.gray3,
              opacity: 0.7,
            }
          : null,
      ]}
    >
      {leftIcon && (
        <Image
          source={leftIcon}
          style={[styles.icon, lefticonStyle, { marginRight: widthPixel(8) }]}
          tintColor={leftIconTintColor}
        />
      )}
      {loading ? (
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="small" color={resolvedText} />
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles?.buttonTitle,
          titleStyle,
          {
            color: resolvedText,
          },
        ]}
        allowFontScaling={true}
      >
        {title}
      </Text>
      {rightIcon && (
        <Image
          source={rightIcon}
          style={[styles.icon, righticonStyle, { marginLeft: widthPixel(8) }]}
          tintColor={rightIconTintColor}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: heightPixel(52),
    width: '100%',
    borderRadius: widthPixel(14),
    // alignSelf: 'center',
    backgroundColor: colors.light.primary,
    ...globalStyles.shadow,
    ...elevation.md,
    marginVertical: heightPixel(5),
  },
  pressed: { opacity: 0.92 },
  spinnerWrap: {
    marginRight: widthPixel(8),
  },
  buttonTitle: {
    textAlign: 'center',
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.semibold,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  icon: {
    width: widthPixel(20),
    height: heightPixel(20),
    resizeMode: 'contain',
  },
});

export default Button;
