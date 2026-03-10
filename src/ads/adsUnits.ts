import { TestIds } from 'react-native-google-mobile-ads';

export const adUnits = {
  banner: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : 'ca-app-pub-xxxxxxxxxxxxx/banner-id',

  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : 'ca-app-pub-xxxxxxxxxxxxx/interstitial-id',
  appOpen: __DEV__
    ? TestIds.APP_OPEN
    : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',

  rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxxxxxxx/rewarded-id',
};
