import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import ThemeText from '../ThemeText'
import { fontPixel, heightPixel } from '../../utils/constants';
import { fontFamilies } from '../../utils/fontfamilies';
import { backarrow } from '../../assets/images';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
interface StartmatchHeaderProps {
title ?: string;
onBack?: () => void; 

}

const StartmatchHeader = (
    {title,onBack} : StartmatchHeaderProps

) => {
    const {isDark} = useThemeContext();
  return (
    <View style={styles.container}>
      <Pressable onPress={onBack}
      hitSlop={20}>
        <Image source={backarrow}
         style={{width:20,height:20,marginRight:10}}
         resizeMode='contain'
         tintColor={colors[isDark ? 'dark' : 'light'].text} />
      </Pressable>
      <View style={{flex:1 , justifyContent:'center',alignItems:'center'}}>
     <ThemeText color='text' 
     style={styles.text}>{title}</ThemeText>
        </View>
    </View>
  )
}

export default StartmatchHeader

const styles = StyleSheet.create({
    container:{
        flexDirection:'row',
        width:'100%',
        justifyContent:'flex-start',
        alignItems:'center',

    },
    text :{
    fontSize : fontPixel(18), 
    fontFamily : fontFamilies.bold,
    marginVertical : heightPixel(20),

    
}
})