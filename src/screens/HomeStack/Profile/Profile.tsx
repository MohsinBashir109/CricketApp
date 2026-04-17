import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import React from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { useDispatch, useSelector } from 'react-redux';

import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import ThemeText from '../../../components/ThemeText';
import { clearuser } from '../../../features/auth/authSlice';
import { handleSignOut } from '../../../services/authServices';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { routes } from '../../../utils/routes';
import { useThemeContext } from '../../../theme/themeContext';

const Profile = () => {
  const { isDark, toggleTheme } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const { user } = useSelector((state: any) => state.auth);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const onSignOut = () => {
    Alert.alert('Sign out', 'You will need to sign in again to sync scores.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          const res = await handleSignOut();
          if (res?.ok) {
            dispatch(clearuser());
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: routes.auth,
                    state: {
                      routes: [{ name: routes.signIn }],
                      index: 0,
                    },
                  },
                ],
              }),
            );
          }
        },
      },
    ]);
  };

  return (
    <HomeWrapper headerShown={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemeText style={styles.screenTitle} color="text">
          Profile
        </ThemeText>
        <ThemeText style={styles.screenSub} color="secondaryText">
          Account and app preferences
        </ThemeText>

        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.primaryMuted,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemeText style={styles.avatarLetter} color="primary">
              {(user?.displayName || user?.email || 'U')
                .toString()
                .trim()
                .charAt(0)
                .toUpperCase()}
            </ThemeText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemeText style={styles.name} color="text" numberOfLines={1}>
              {user?.displayName || 'Player'}
            </ThemeText>
            <ThemeText style={styles.email} color="secondaryText" numberOfLines={1}>
              {user?.email ?? 'Not signed in'}
            </ThemeText>
          </View>
        </View>

        <ThemeText style={styles.sectionLabel} color="secondaryText">
          Appearance
        </ThemeText>
        <View
          style={[
            styles.rowCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <ThemeText style={styles.rowTitle} color="text">
              Dark mode
            </ThemeText>
            <ThemeText style={styles.rowSub} color="desText">
              Easier on the eyes for night scoring
            </ThemeText>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.gray3, true: theme.primaryMuted }}
            thumbColor={isDark ? theme.primary : theme.surface}
          />
        </View>

        <ThemeText style={styles.sectionLabel} color="secondaryText">
          Match data
        </ThemeText>
        <View
          style={[
            styles.rowCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ThemeText style={styles.rowTitle} color="text">
            History & scorecards
          </ThemeText>
          <ThemeText style={styles.rowSub} color="desText">
            Saved on this device and synced when signed in.
          </ThemeText>
        </View>

        <ThemeText style={styles.sectionLabel} color="secondaryText">
          Account
        </ThemeText>
        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [
            styles.signOutCard,
            {
              borderColor: theme.error,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <ThemeText style={styles.signOutText} color="error">
            Sign out
          </ThemeText>
        </Pressable>

        <View style={{ marginTop: heightPixel(12) }}>
          <Button
            title="Back to home"
            bgColor="buttonBackGroundOther"
            textColor="primary"
            onPress={() => navigation.navigate(routes.matches as never)}
          />
        </View>
      </ScrollView>
    </HomeWrapper>
  );
};

export default Profile;

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  scrollContent: {
    paddingBottom: heightPixel(32),
  },
  screenTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(26),
    marginTop: heightPixel(8),
  },
  screenSub: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    marginTop: heightPixel(6),
    marginBottom: heightPixel(20),
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(16),
    marginBottom: heightPixel(24),
    gap: widthPixel(14),
  },
  avatar: {
    width: widthPixel(56),
    height: widthPixel(56),
    borderRadius: widthPixel(16),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(22),
  },
  name: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  email: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    marginTop: heightPixel(4),
  },
  sectionLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: heightPixel(8),
  },
  rowCard: {
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(16),
    marginBottom: heightPixel(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
  },
  rowTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(16),
  },
  rowSub: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    marginTop: heightPixel(4),
    lineHeight: fontPixel(18),
  },
  signOutCard: {
    borderRadius: widthPixel(16),
    borderWidth: 1.5,
    paddingVertical: heightPixel(14),
    alignItems: 'center',
    marginBottom: heightPixel(8),
  },
  signOutText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
});
