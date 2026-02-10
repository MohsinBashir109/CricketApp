import { StyleSheet, Text, View } from 'react-native';

import React from 'react';
import Button from '../../../components/themeButton';
import { handleSignOut } from '../../../services/authServices';

import { routes } from '../../../utils/routes';

const Home = (navigation: any) => {
  
  const handleLogout = async () => {
    console.log("press");
    
  const res = await handleSignOut();
  console.log('logout', res);
  if(res?.ok){
    // Successfully signed out, you can navigate to the login screen or perform other actions here  
    navigation.navigate(routes.signIn); // Replace 'SignIn' with your actual sign-in screen name
  }
}
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
