import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontFamilies, globalStyles } from '../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';

import React from 'react';
import { colors } from '../utils/colors';
import { useThemeContext } from '../theme/themeContext';

interface ButtonProps {
  title: string;
  buttonStyle?: any;
  bgColor?: keyof typeof colors.light | keyof typeof colors.dark | string;
  textColor?: keyof typeof colors.light | keyof typeof colors.dark | string;
  titleStyle?: any;
  onPress: () => void;
  disabled?: boolean;
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
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        buttonStyle,
        {
          backgroundColor: isDark
            ? colors.dark[
                bgColor ? (bgColor as keyof typeof colors.dark) : 'green'
              ]
            : colors.light[
                bgColor ? (bgColor as keyof typeof colors.light) : 'green'
              ],
        },
        disabled && {
          backgroundColor: isDark ? colors.dark.gray1 : colors.light.gray3,
          opacity: 0.6,
        },
      ]}
    >
      {leftIcon && (
        <Image
          source={leftIcon}
          style={[styles.icon, lefticonStyle, { marginRight: widthPixel(8) }]}
          tintColor={leftIconTintColor}
        />
      )}
      <Text
        numberOfLines={1}
        style={[
          styles?.buttonTitle,
          titleStyle,
          {
            color: isDark
              ? colors.dark[
                  textColor ? (textColor as keyof typeof colors.dark) : 'white'
                ]
              : colors.light[
                  textColor ? (textColor as keyof typeof colors.light) : 'white'
                ],
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
    height: heightPixel(45),
    width: '100%',
    borderRadius: widthPixel(10),
    alignSelf: 'center',
    backgroundColor: colors.light.primary,
    ...globalStyles.shadow,
    elevation: 5,
    // higher = more shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginVertical: heightPixel(5),
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
