import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { lock, mail, visibility } from '../../../assets/images';

import AuthWrapper from '../../../wrappers/AuthWrapper';
import Button from '../../../components/themeButton';
import ThemeInput from '../../../components/ThemeInput';
import ThemeText from '../../../components/ThemeText';
import { handleSignIn } from '../../../services/authServices';
import { heightPixel } from '../../../utils/constants';
import { routes } from '../../../utils/routes';
import { setuser } from '../../../features/auth/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../../../theme/themeContext';

const Signin = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isloading, setIsloading] = useState(false);

  const onSignInPress = async () => {
    if (!email || !password) {
      return;
    }

    try {
      setIsloading(true);
      const res = await handleSignIn(email, password);
      console.log('signin', res);
      if (res?.ok) {
        dispatch(setuser(res.user));

        navigation.replace(routes.home);
      }
      setIsloading(false);
    } catch (error) {
      console.log('signup error', error);
      setIsloading(false);
    }
  };
  if (isloading) {
    return (
      <AuthWrapper>
        <ActivityIndicator size="large" color="#0000ff" />
      </AuthWrapper>
    );
  }

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
          inputWrapperStyle={[
            authFieldLift.base,
            isDark ? authFieldLift.shadowDark : authFieldLift.shadowLight,
          ]}
        />

        <View style={{ height: heightPixel(12) }} />

        <ThemeInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={lock}
          rightIcon={visibility}
          inputWrapperStyle={[
            authFieldLift.base,
            isDark ? authFieldLift.shadowDark : authFieldLift.shadowLight,
          ]}
        />

        <TouchableOpacity
          onPress={() => {}}
          style={styles.forgot}
          activeOpacity={0.8}
        >
          <ThemeText color="secondary" style={styles.forgotText}>
            Forgot password?
          </ThemeText>
        </TouchableOpacity>

        <View style={{ height: heightPixel(18) }} />

        <Button
          title="Sign In"
          onPress={onSignInPress}
          buttonStyle={[
            authCtaLift.base,
            isDark ? authCtaLift.shadowDark : authCtaLift.shadowLight,
          ]}
        />

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

const authFieldLift = StyleSheet.create({
  base: {
    elevation: Platform.OS === 'android' ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  shadowLight: { shadowOpacity: 0.12 },
  shadowDark: { shadowOpacity: 0.3 },
});

const authCtaLift = StyleSheet.create({
  base: {
    elevation: Platform.OS === 'android' ? 10 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
  },
  shadowLight: { shadowOpacity: 0.2 },
  shadowDark: { shadowOpacity: 0.35 },
});

const styles = StyleSheet.create({
  scroll: {
    // ✅ important
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1, // ✅ important
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
