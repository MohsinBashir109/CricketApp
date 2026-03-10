// ads/appOpenManager.ts

import {
  AdEventType,
  AppOpenAd,
  TestIds,
} from 'react-native-google-mobile-ads';

import { adUnits } from './adsUnits';

const appOpenAd = AppOpenAd.createForAdRequest(adUnits.appOpen);

let isLoaded = false;
let isShowing = false;
let loadTime = 0;

let onClosedCallback: null | (() => void) = null;
let onErrorCallback: null | (() => void) = null;

appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
  isLoaded = true;
  loadTime = Date.now();
});

appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
  isLoaded = false;
  isShowing = false;
  onClosedCallback?.();
  onClosedCallback = null;
  onErrorCallback = null;
  appOpenAd.load(); // preload next one
});

appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
  isLoaded = false;
  isShowing = false;
  onErrorCallback?.();
  onClosedCallback = null;
  onErrorCallback = null;
  appOpenAd.load(); // try again for next launch
});

export const loadAppOpenAd = () => {
  if (!isLoaded && !isShowing) {
    appOpenAd.load();
  }
};

export const showAppOpenAd = ({
  onClosed,
  onError,
}: {
  onClosed?: () => void;
  onError?: () => void;
} = {}) => {
  const isExpired = Date.now() - loadTime > 4 * 60 * 60 * 1000;

  onClosedCallback = onClosed ?? null;
  onErrorCallback = onError ?? null;

  if (!0 || isShowing || isExpired) {
    return false;
  }

  isShowing = true;
  appOpenAd.show();
  return true;
};
