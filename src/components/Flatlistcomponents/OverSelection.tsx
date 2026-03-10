import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { ball, cross } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import AppBanner from '../../ads/AppBanner';
import { BannerAdSize } from 'react-native-google-mobile-ads';
import Button from '../themeButton';
import { Dimensions } from 'react-native';
import ThemeInput from '../ThemeInput';
import ThemeText from '../ThemeText';
import { adUnits } from '../../ads/adsUnits';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

const DATA = [
  { id: '1', title: '10 overs', overs: 10 },
  { id: '2', title: '20 overs', overs: 20 },
  { id: '3', title: '50 overs ', overs: 50 },
  { id: '9999', title: 'Custom overs', overs: 0 },
];

interface OverSelectionProps {
  onSelect: (overs: number) => void;
}

const OverSelection = ({ onSelect }: OverSelectionProps) => {
  const { isDark } = useThemeContext();
  const numColumns = 2; // Number of columns you want
  const screenWidth = Dimensions.get('window').width - widthPixel(80);
  // Total screen width minus some padding
  const [customOvers, SetcustomOvers] = useState('');
  const [customOversModal, SetcustomOversModal] = useState(false);
  const tileSize = screenWidth / numColumns;
  const handleConfirmCustomOvers = () => {
    const oversNum = Number(customOvers);

    if (!Number.isFinite(oversNum) || oversNum <= 0) return; // (optional: show toast)
    console.log('--------------->overssdfdsfdsf', oversNum);

    onSelect(oversNum);
    SetcustomOversModal(false);
  };
  const handleSelectOvers = (item: any) => {
    if (String(item?.id) === '9999') {
      SetcustomOversModal(true);
      return;
    }
    onSelect(item.overs);
  };
  const isValidOvers = Number(customOvers) > 0;
  const renderItem = ({ item }: any) => (
    <Pressable
      style={{
        width: tileSize,
        height: tileSize,
        borderRadius: widthPixel(10),
        backgroundColor: colors[isDark ? 'dark' : 'light'].primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        margin: widthPixel(5),
      }}
      onPress={() => handleSelectOvers(item)}
    >
      <ThemeText color="text" style={styles.text}>
        {item.title}
      </ThemeText>
    </Pressable>
  );
  return (
    <View>
      <FlatList
        data={DATA}
        renderItem={renderItem}
        numColumns={numColumns}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          alignItems: 'center',
          paddingVertical: heightPixel(20),
        }}
      />
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: heightPixel(8),
          marginBottom: heightPixel(50),
        }}
      >
        <AppBanner
          size={BannerAdSize.MEDIUM_RECTANGLE}
          adUnits={adUnits.banner}
        />
      </View>
      <Modal
        visible={customOversModal}
        onRequestClose={() => SetcustomOversModal(false)}
        transparent
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
          onPress={() => {
            SetcustomOversModal(false);
            SetcustomOvers('');
          }}
        >
          <View
            style={[
              styles.Modal,
              {
                backgroundColor: colors[isDark ? 'dark' : 'light'].background,
                borderWidth: widthPixel(1),
                borderColor: colors[isDark ? 'dark' : 'light'].primary,
              },
            ]}
          >
            <View
              style={[
                styles.headerModal,
                {
                  backgroundColor: colors[isDark ? 'dark' : 'light'].primary,
                },
              ]}
            >
              <ThemeText color="text" style={styles.text}>
                Match Overs
              </ThemeText>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => {
                  SetcustomOversModal(false);
                  SetcustomOvers('');
                }}
              >
                <Image
                  source={cross}
                  tintColor={colors[isDark ? 'dark' : 'light'].white}
                  style={styles.image}
                />
              </Pressable>
            </View>
            <View
              style={{
                paddingHorizontal: widthPixel(20),
                marginVertical: heightPixel(20),
              }}
            >
              <ThemeInput
                placeholder="Enter number of overs (e.g., 10)"
                value={String(customOvers)}
                onChangeText={(t: string) => SetcustomOvers(t)}
                keyboardType="number-pad"
                leftIcon={ball}
              />
              <Button
                onPress={handleConfirmCustomOvers}
                title="Confirm"
                disabled={!isValidOvers}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default OverSelection;

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(16),
  },
  Modal: {
    width: '90%',
    // paddingHorizontal: widthPixel(20),
    borderRadius: widthPixel(10),
    overflow: 'hidden',
  },
  headerModal: {
    flexDirection: 'row',
    paddingHorizontal: widthPixel(15),
    paddingVertical: heightPixel(15),
  },
  image: {
    width: widthPixel(20),
    height: heightPixel(20),
    resizeMode: 'contain',
  },
});
