import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import { Dimensions } from 'react-native';
import React from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

const DATA = [

  { id: '1', title: '10 overs', overs: 10 },
  { id: '2', title: '20 overs', overs: 20 },
  { id: '3', title: '50 overs ', overs: 50 },
  { id: '4', title: 'Custom overs', overs: 0 },
];

interface OverSelectionProps {
  onSelect: (overs: number) => void;
}

const OverSelection = ({ onSelect }: OverSelectionProps) => {
  const { isDark } = useThemeContext();
  const numColumns = 2; // Number of columns you want
  const screenWidth = Dimensions.get('window').width - widthPixel(80); // Total screen width minus some padding
  const tileSize = screenWidth / numColumns;
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
      onPress={() => onSelect(item.overs)}
    >
      <ThemeText color="text" style={styles.text}>
        {item.title}
      </ThemeText>
    </Pressable>
  );
  return (
    <FlatList
      data={DATA}
      renderItem={renderItem}
      numColumns={numColumns}
      keyExtractor={item => item.id}
      contentContainerStyle={{ alignItems: 'center' ,paddingVertical: heightPixel(20)}}
    />
  );
};

export default OverSelection;

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(16),
   
  },
});
