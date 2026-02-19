import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { widthPixel } from '../../utils/constants';
import ThemeText from '../ThemeText';

const BatsmenBowlerScorringHeader = ({ title }: any) => {
  return (
    <View
      style={{
        width: '100%',
        paddingHorizontal: widthPixel(20),
        flexDirection: 'row',
      }}
    >
      <View style={{ flex: 1 }}>
        <ThemeText color="text">{title}</ThemeText>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ marginHorizontal: widthPixel(40) }}>
          <ThemeText color="text">R</ThemeText>
        </View>
        <View style={{ marginHorizontal: widthPixel(40) }}>
          <ThemeText color="text">B</ThemeText>
        </View>
        <View style={{ marginHorizontal: widthPixel(20) }}>
          <ThemeText color="text">Sr</ThemeText>
        </View>
      </View>
    </View>
  );
};

export default BatsmenBowlerScorringHeader;

const styles = StyleSheet.create({});
