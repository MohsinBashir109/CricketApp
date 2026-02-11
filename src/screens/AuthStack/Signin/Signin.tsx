import React, { Activity, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';

import AuthWrapper from '../../../wrappers/AuthWrapper';
import ThemeInput from '../../../components/ThemeInput';
import ThemeText from '../../../components/ThemeText';
import { heightPixel } from '../../../utils/constants';
import { routes } from '../../../utils/routes';
import { useNavigation } from '@react-navigation/native';
import Button from '../../../components/themeButton';
import { mail, lock, visibility } from '../../../assets/images';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { handleSignIn } from '../../../services/authServices';

const Signin = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isloading, setIsloading] = useState(false);

 const Signin= async() => {
    if(!email || !password ){
      
      return;
    }
    
    
    try {
      setIsloading(true);
       const res = await handleSignIn(email, password);
      console.log('signin', res);
      if(res?.ok){
        navigation.navigate(routes.home);
      }
      setIsloading(false);
    } catch (error) {
      console.log('signup error', error);
      setIsloading(false);
    }
     

    
  };
  if(isloading){
    return (
      <AuthWrapper>
        <ActivityIndicator size="large" color="#0000ff" />
      </AuthWrapper>)}
  

  return (
    <AuthWrapper
      text="Welcome Back!"
      desText="Sign in to continue scoring every ball, every run."
    >
      {/* <KeyboardAwareScrollView
        style={styles.scroll} // ✅ fills space
        contentContainerStyle={styles.scrollContent} // ✅ controls layout
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      > */}
        <View style={styles.form}>
          <ThemeInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon={mail}
          />

          <View style={{ height: heightPixel(12) }} />

          <ThemeInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={lock}
            rightIcon={visibility}
          />

          <TouchableOpacity onPress={() => {}} style={styles.forgot} activeOpacity={0.8}>
            <ThemeText color="secondary" style={styles.forgotText}>
              Forgot password?
            </ThemeText>
          </TouchableOpacity>

          <View style={{ height: heightPixel(18) }} />

          <Button title="Sign In" onPress={Signin} />

          <View style={styles.bottomRow}>
            <ThemeText color="secondary">Don&apos;t have an account? </ThemeText>
            <TouchableOpacity
              onPress={() => navigation.navigate(routes.signUp)}
              activeOpacity={0.8}
            >
              <ThemeText color="text" style={styles.link}>
                Sign Up
              </ThemeText>
            </TouchableOpacity>
          </View>
        </View>
      {/* </KeyboardAwareScrollView> */}
    </AuthWrapper>
  );
};

export default Signin;

const styles = StyleSheet.create({
  scroll: {
        // ✅ important
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,    // ✅ important
    paddingTop: heightPixel(30),
    paddingBottom: heightPixel(24),
  },
  form: {
    width: '100%',
  },
  forgot: {
    marginTop: heightPixel(10),
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 13,
  },
  bottomRow: {
    marginTop: heightPixel(18),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    fontWeight: '700',
  },
});
