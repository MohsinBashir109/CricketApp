import { fontPixel, heightPixel } from './constants';

const tintColorLight = '#0a7ea4';

export const colors = {
  light: {
    drawerGradient: ['#008080', '#59ACAC'],
    dark: '#0A2342',
    primary: '#008080',
    // primary: '#58E6FF',

    secondary: '#6B7280AB',
    text: '#001A00',
    background: '#FFFFFF',
    white: '#FFFFFF',
    headerColor: '#FFFFFF',
    tint: tintColorLight,
    headerColorText: '#008080',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    gray1: '#9CA3AF',
    gray2: '#4B5563',
    gray3: '#D1D5DB',
    gray4: '#D9D9D9',
    gray5: '#EFEFEF',
    gray6: '#f3f4f6',
    secondaryText: '#6B7280A3',
    red: '#FF4444',
    error: '#FF0000',
    buttonBackGround: '#30A7FB',
    buttonBackGroundOther: '#D9D9D9',
    desText: '#666666',
    fogotText: '#067CCF',
    orColor: '#6B7280BD',
    transparent: 'transparent',
    bottomTab: '#74EAFF',
    green: '#008080',
    tabGradient: ['#008080', '#59ACAC'],
    drawerbackground: '#008080',
    settingsBackgroundRows: ['#008080', '#59ACAC'],
    wRefresh: '#EAFBE7',
  },
  dark: {
    // ✅ background system
    drawerGradient: ['#0B0F0E', '#0B0F0E'],
    background: '#0B0F0E', // near-black (better than pure #000)
    surface: '#0F1513', // cards/sheets
    white: '#FFFFFF',
    drawerbackground: '#0B0F0E',
    headerColor: '#00A32C',
    headerColorText: '#FFFFFF',
    wRefresh: '#EAFBE7',
    // ✅ neon accent
    primary: '#00A32C', // neon green
    green: '#00A32C',
    settingsBackgroundRows: ['#0B0F0E', '#0B0F0E'],
    // ✅ text
    text: '#EAFBE7', // readable on dark
    secondaryText: '#A7B3AD', // muted text
    desText: '#A7B3AD',

    // ✅ grays / borders
    gray1: '#2A3330',
    gray2: '#1E2623',
    gray3: '#22302B',
    gray4: '#2C3A34',
    gray5: '#141B18',
    gray6: '#101614',

    // ✅ icons/tabs
    icon: '#A7B3AD',
    tabIconDefault: '#7B8A83',
    tabIconSelected: '#00A32C',

    // ✅ status colors
    red: '#FF4D4D',
    error: '#FF4D4D',

    // ✅ buttons
    buttonBackGround: '#00A32C', // neon
    buttonBackGroundOther: '#1A231F', // secondary button background
    fogotText: '#00A32C',

    // optional
    secondary: '#A7B3AD',
    transparent: 'transparent',
    bottomTab: '#0F1513',
    dark: '#000000',
    tint: '#00A32C',
    orColor: '#A7B3AD',
    tabGradient: ['#00A32C', '#0FFF50'],
  },
};
