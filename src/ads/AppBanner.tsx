import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  useForeground,
} from 'react-native-google-mobile-ads';
import React, { useRef, useState } from 'react';

import { adUnits } from './adsUnits';

type AppBannerProps = {
  size?: (typeof BannerAdSize)[keyof typeof BannerAdSize];
  adUnits?: any;
};

const AppBanner = ({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  adUnits,
}: AppBannerProps) => {
  const bannerRef = useRef<BannerAd>(null);
  const [isLoading, setIsLoading] = useState(true);

  useForeground(() => {
    if (Platform.OS === 'ios') {
      bannerRef.current?.load();
    }
  });

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator style={{ marginBottom: 8 }} />}
      <BannerAd
        key={String(size)}
        ref={bannerRef}
        unitId={adUnits}
        size={size}
        onAdLoaded={() => setIsLoading(false)}
        onAdFailedToLoad={() => setIsLoading(false)}
      />
    </View>
  );
};

export default AppBanner;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
