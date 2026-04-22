import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import React, { useState } from 'react';
import {
  ball,
  cricket,
  lightning,
  setting,
  throphy,
} from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';

import Button from '../themeButton';
import ThemeInput from '../ThemeInput';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

const DATA = [
  {
    id: '1',
    title: '10 overs',
    overs: 10,
    icon: lightning,
    des: 'Fast and fun ',
    button: 'Quick Play',
  },
  {
    id: '2',
    title: '20 overs',
    overs: 20,
    icon: throphy,
    des: 'Balanced match format',
    button: 'Most Popular',
  },
  {
    id: '3',
    title: '50 overs ',
    overs: 50,
    icon: cricket,
    des: 'Full match experience',
    button: 'Classic',
  },
  {
    id: '9999',
    title: 'Custom overs',
    overs: 0,
    icon: setting,
    des: 'Set your own match length',
    button: 'Flexible',
  },
];

interface OverSelectionProps {
  onSelect: (overs: number) => void;
}

const OverSelection = ({ onSelect }: OverSelectionProps) => {
  const { isDark } = useThemeContext();
  const numColumns = 2;
  const screenWidth = Dimensions.get('window').width - widthPixel(80);
  const [customOvers, SetcustomOvers] = useState('');
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const tileSize = screenWidth / numColumns;
  const theme = colors[isDark ? 'dark' : 'light'];

  const handleConfirmCustomOvers = () => {
    const oversNum = Number(customOvers);
    if (!Number.isFinite(oversNum) || oversNum <= 0) return;
    onSelect(oversNum);
    setShowCustomPanel(false);
    SetcustomOvers('');
  };

  const handleSelectOvers = (item: any) => {
    if (String(item?.id) === '9999') {
      setShowCustomPanel(true);
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
        borderRadius: widthPixel(16),
        backgroundColor: theme.surface,
        borderWidth: 2,
        borderColor: theme.primaryMuted,
        justifyContent: 'center',
        alignItems: 'center',
        margin: widthPixel(5),
        ...(isDark ? cardShadowSm(true) : cardShadowSm(false)),
      }}
      onPress={() => handleSelectOvers(item)}
    >
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={item?.icon}
          style={{
            width: widthPixel(36),
            height: heightPixel(36),
            resizeMode: 'contain',
          }}
        />
      </View>
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ThemeText color="text" style={styles.text}>
          {item.title}
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.textDes}>
          {item?.des}
        </ThemeText>
        <View
          style={{
            backgroundColor: theme.primaryMuted,
            width: widthPixel(100),
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: widthPixel(12),
            paddingVertical: heightPixel(6),
            paddingHorizontal: widthPixel(6),
            marginVertical: heightPixel(6),
          }}
        >
          <ThemeText numberOfLines={1} color="primary" style={styles.textDes1}>
            {item?.button}
          </ThemeText>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={{ marginTop: heightPixel(20) }}>
      <View>
        <ThemeText color="text" style={styles.mainText}>
          Pick the number of overs to set the pace of your game.
        </ThemeText>
        <ThemeText color="text" style={styles.mainTextDes}>
          Quick match, standard game, or full-length battle choose what fits
          best.
        </ThemeText>
      </View>
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

      {showCustomPanel && (
        <View
          style={[
            styles.customPanel,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemeText color="text" style={styles.customTitle}>
            Custom overs
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.customHint}>
            Enter how many overs for this match (e.g. 12).
          </ThemeText>
          <ThemeInput
            placeholder="Number of overs"
            value={String(customOvers)}
            onChangeText={(t: string) => SetcustomOvers(t)}
            keyboardType="number-pad"
            leftIcon={ball}
          />
          <Button
            onPress={handleConfirmCustomOvers}
            title="Use this length"
            disabled={!isValidOvers}
          />
          <Pressable
            onPress={() => {
              setShowCustomPanel(false);
              SetcustomOvers('');
            }}
            style={styles.cancelCustom}
          >
            <ThemeText color="primary" style={styles.cancelCustomText}>
              Cancel
            </ThemeText>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default OverSelection;

const styles = StyleSheet.create({
  mainText: {
    marginTop: heightPixel(10),
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
    textAlign: 'justify',
  },
  mainTextDes: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    textAlign: 'justify',
  },
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(16),
  },
  textDes: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(12),
    textAlign: 'center',
  },
  textDes1: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
  },
  customPanel: {
    marginHorizontal: widthPixel(4),
    marginBottom: heightPixel(24),
    padding: widthPixel(16),
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
  },
  customTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(17),
    marginBottom: heightPixel(6),
  },
  customHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    marginBottom: heightPixel(12),
    lineHeight: fontPixel(18),
  },
  cancelCustom: {
    alignSelf: 'center',
    marginTop: heightPixel(10),
    paddingVertical: heightPixel(8),
  },
  cancelCustomText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});
