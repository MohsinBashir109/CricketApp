import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

let initialized = false;

export async function initMobileAds() {
  if (initialized) return;

  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.T,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
    testDeviceIdentifiers: ['EMULATOR'],
  });

  await mobileAds().initialize();
  initialized = true;
}
