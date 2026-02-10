import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';

import { colors } from '../utils/colors';
import { fontFamilies } from '../utils/fontfamilies';
import { useThemeContext } from '../theme/themeContext';

type TextInputField = {
  isVisible?: boolean;
  onPressRightIcon?: () => void;
  placeholder?: string;
  value?: any;
  placeHolderColor?: string;
  styleContainer?: ViewStyle;
  onFocus?: any;
  onBlur?: any;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  title?: string;
  secureTextEntry?: boolean;
  leftIcon?: any;
  rightIcon?: any;
  containerStyleOuter?: any;
  underLefttitle?: string;
  isVisibleRightIcon?: boolean;
  onSubmitEditing?: any;
  ref?: any;
  keyboardType?: any;
  returnKeyType?: any;
  blurOnSubmit?: any;
};

const ThemeInput = (props: TextInputField) => {
  const { isDark } = useThemeContext();
  return (
    <View style={[style.containerOuter, props.containerStyleOuter]}>
      {props.title && (
        <Text
          style={[
            style.title,
            { color: colors[isDark ? 'dark' : 'light'].text },
          ]}
        >
          {props.title}
        </Text>
      )}

      <View
        style={[
          style.mainConatiner,
          {
            backgroundColor: colors[isDark ? 'dark' : 'light'].background,
            borderWidth: 1,
            borderColor: isDark
              ? colors[isDark ? 'dark' : 'light'].primary
              : colors[isDark ? 'dark' : 'light'].gray4,
          },
        ]}
      >
        <Image
          resizeMode="contain"
          style={style.leftIcon}
          source={props.leftIcon}
          tintColor={colors[isDark ? 'dark' : 'light'].primary}
        />
        <TextInput
          returnKeyType={props.returnKeyType}
          ref={props.ref}
          onSubmitEditing={props.onSubmitEditing}
          placeholder={props.placeholder}
          onBlur={props.onBlur}
          onFocus={props.onFocus}
          value={props.value}
          onChangeText={props.onChangeText}
          editable={props.editable}
          placeholderTextColor={colors[isDark ? 'dark' : 'light'].text}
          style={[
            style.container,
            props.styleContainer,
            { color: colors[isDark ? 'dark' : 'light'].desText },
          ]}
          secureTextEntry={props.secureTextEntry}
          keyboardType={props.keyboardType}
          blurOnSubmit={props.blurOnSubmit}
        />
        {props.rightIcon && (
          <TouchableOpacity
            onPress={props.onPressRightIcon}
            style={style.Touch}
            activeOpacity={0.7}
          >
            <Image
              resizeMode="contain"
              style={style.rightIcon}
              source={props.rightIcon}
              tintColor={
                props.isVisibleRightIcon
                  ? colors[isDark ? 'dark' : 'light'].gray1
                  : colors[isDark ? 'dark' : 'light'].primary
              }
            />
          </TouchableOpacity>
        )}
      </View>
      {props.underLefttitle && (
        <Text
          style={[
            style.underTitle,
            { color: colors[isDark ? 'dark' : 'light'].primary },
          ]}
        >
          {props.underLefttitle}
        </Text>
      )}
    </View>
  );
};

export default ThemeInput;
const style = StyleSheet.create({
  underTitle: {
    marginTop: heightPixel(10),
    fontFamily: fontFamilies.seniregular,
    fontSize: fontPixel(14),
    marginLeft: widthPixel(10),
  },
  Touch: {
    marginHorizontal: widthPixel(10),
  },

  containerOuter: {},
  leftIcon: {
    width: widthPixel(20),
    height: widthPixel(20),
    marginHorizontal: widthPixel(10),
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
    marginLeft: widthPixel(5),
    marginBottom: heightPixel(5),
    elevation: 5,
  },
  mainConatiner: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    elevation: 5,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  container: {
    flex: 1,
    height: heightPixel(45),
    textAlign: 'left',
  },
  rightIcon: {
    width: widthPixel(24),
    height: widthPixel(24),
  },
});
