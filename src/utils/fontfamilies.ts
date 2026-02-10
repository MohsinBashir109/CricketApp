import { fontPixel, heightPixel } from './constants';

import { Platform } from 'react-native';
import { colors } from './colors';

const isAndroid = Platform.OS === 'android';
export const fontFamilies = {
  regular: isAndroid ? 'Inter_28pt-Light' : 'Inter_28pt-Light',
  seniregular: isAndroid ? 'Inter_28pt-Regular' : 'Inter_28pt-Regular',
  medium: isAndroid ? 'Inter_28pt-Medium' : 'Inter_28pt-Medium',
  semibold: isAndroid ? 'Inter_28pt-SemiBold' : 'Inter_28pt-SemiBold',
  bold: isAndroid ? 'Inter_28pt-Bold' : 'Inter_28pt-Bold',
  extrabold: isAndroid
    ? 'Inter_28pt-ExtraBold.ttf'
    : 'Inter_28pt-ExtraBold.ttf',
};
export const globalStyles = {
  mediumHeading: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.semibold,
  },
  smallDescription: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.regular,
    color: colors.light.secondaryText,
  },
  shadow: {
    boxShadow: '0px 1px 2px 2px rgba(210, 206, 206, 0.1)',
  },
  errorText: {
    fontSize: fontPixel(12),
    marginBottom: heightPixel(10),
  },
};
