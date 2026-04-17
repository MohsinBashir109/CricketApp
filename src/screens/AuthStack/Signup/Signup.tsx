import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { lock, mail, usernameicon, visibility } from '../../../assets/images';

import AuthWrapper from '../../../wrappers/AuthWrapper';
import Button from '../../../components/themeButton';
import ThemeInput from '../../../components/ThemeInput';
import ThemeText from '../../../components/ThemeText';
import { db } from '../../../dbConfig/firebase';
import { handleSignUp } from '../../../services/authServices';
import { heightPixel } from '../../../utils/constants';
import { routes } from '../../../utils/routes';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../../../theme/themeContext';

const Signup = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isloading, setIsloading] = useState(false);

  const onSignUpPress = async () => {
    if (!email || !password || !userName || !confirmPassword) {
      return;
    }
    if (password !== confirmPassword) {
      return;
    }

    try {
      setIsloading(true);
      const res = await handleSignUp(email, password, userName);
      console.log('signup', res);
      if (res?.ok) {
        const firebaseUser = res?.user;

        if (firebaseUser?.uid) {
          const set = await setDoc(doc(db, 'users', firebaseUser.uid), {
            uid: firebaseUser.uid,
            email: firebaseUser.email || email,
            userName: userName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log('asdasdasdasd', set);
          navigation.navigate(routes.signIn);
        }
      }
      setIsloading(false);
    } catch (error) {
      console.log('signup error', error);
      setIsloading(false);
    }
  };
  if (isloading) {
    return (
      <AuthWrapper
        text="Creating your account..."
        desText="Please wait while we set things up for you."
      >
        <View style={{ marginTop: heightPixel(30) }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper
      text="Create your account"
      desText="Join to track matches, squads, and live scoring."
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
          placeholder="Username"
          value={userName}
          onChangeText={setUsername}
          keyboardType="email-address"
          leftIcon={usernameicon}
          inputWrapperStyle={[
            authFieldLift.base,
            isDark ? authFieldLift.shadowDark : authFieldLift.shadowLight,
          ]}
        />

        <ThemeInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          leftIcon={mail}
          inputWrapperStyle={[
            authFieldLift.base,
            isDark ? authFieldLift.shadowDark : authFieldLift.shadowLight,
          ]}
        />
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
        <ThemeInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
          title="Sign Up"
          onPress={onSignUpPress}
          buttonStyle={[
            authCtaLift.base,
            isDark ? authCtaLift.shadowDark : authCtaLift.shadowLight,
          ]}
        />

        <View style={styles.bottomRow}>
          <ThemeText color="secondary">Already have an account? </ThemeText>
          <TouchableOpacity
            onPress={() => navigation.replace(routes.signIn)}
            activeOpacity={0.8}
          >
            <ThemeText color="text" style={styles.link}>
              Sign In
            </ThemeText>
          </TouchableOpacity>
        </View>
      </View>
      {/* </KeyboardAwareScrollView> */}
    </AuthWrapper>
  );
};

export default Signup;

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
