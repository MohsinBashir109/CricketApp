import { CommonActions, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../../components/themeButton';
import React from 'react';
import { handleSignOut } from '../../../services/authServices';
import { routes } from '../../../utils/routes';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { fontPixel, heightPixel } from '../../../utils/constants';
import { fontFamilies } from '../../../utils/fontfamilies';
import { matches } from '../../../assets/images';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
export default function Home() {
  const navigation = useNavigation<any>();
const {isDark} = useThemeContext();
  const handleLogout = async () => {
    const res = await handleSignOut();
    

    if (res?.ok) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routes.auth }], // OR routes.authStack (see note below)
        }),
      );
    }
  };
  const StartMatch = () => {
    navigation.navigate(routes.startMatch);
  };

  return (
    <HomeWrapper headerShown={true}>
    <View style={styles.container}>
      
      <Button title="Start New Match" onPress={StartMatch}
        buttonStyle={styles.button} 
        titleStyle={styles.text} 
        leftIcon={matches}
        leftIconTintColor={colors[isDark ? 'dark' : 'light'].white}
        
         />
         {/* <Button title="Start New Match" onPress={handleLogout}
        // 
        
         /> */}
      
    </View>
    </HomeWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,width:'100%' },
  button :{
  
    elevation:5,
    marginTop:heightPixel(50)
  },
  text :{
    fontFamily:fontFamilies.semibold,
    fontSize:fontPixel(18)
  }
});
