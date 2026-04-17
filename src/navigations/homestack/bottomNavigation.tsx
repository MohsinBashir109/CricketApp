import * as HomeScreens from '../../screens/HomeStack/HomeStack';

import { Image, Platform, StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { matches, profile, throphy } from '../../assets/images';

import React from 'react';
import ThemeText from '../../components/ThemeText';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { routes } from '../../utils/routes';
import { useThemeContext } from '../../theme/themeContext';

const Tab = createBottomTabNavigator();

type TabIconProps = {
  focused: boolean;
  label: string;
  source: number;
};

const TabIcon = ({ focused, label, source }: TabIconProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  return (
    <View style={styles.iconColumn}>
      <Image
        source={source}
        style={[
          styles.tabIcon,
          focused ? styles.tabIconFocused : styles.tabIconMuted,
          { tintColor: focused ? theme.tabIconSelected : theme.tabIconDefault },
        ]}
        resizeMode="contain"
      />
      <ThemeText
        color={focused ? 'tabIconSelected' : 'tabIconDefault'}
        style={[styles.tabLabel, focused && styles.tabLabelFocused]}
        numberOfLines={1}
      >
        {label}
      </ThemeText>
    </View>
  );
};

const tabIconMatches = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} label="Home" source={matches} />
);
const tabIconTournaments = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} label="Tournaments" source={throphy} />
);
const tabIconProfile = ({ focused }: { focused: boolean }) => (
  <TabIcon focused={focused} label="Profile" source={profile} />
);

export const BottomTabs = () => {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const tabBarHeight =
    Platform.OS === 'android'
      ? heightPixel(52) + insets.bottom
      : heightPixel(50) + insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName={routes.matches}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: heightPixel(6),
          paddingBottom:
            Platform.OS === 'ios'
              ? Math.max(insets.bottom, heightPixel(8))
              : heightPixel(6) + insets.bottom,
          paddingHorizontal: widthPixel(4),
          backgroundColor: theme.bottomTab,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
          elevation: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 10,
        },
      }}
    >
      <Tab.Screen
        name={routes.matches}
        component={HomeScreens.Matches}
        options={{
          tabBarAccessibilityLabel: 'Home, matches and scoring',
          tabBarIcon: tabIconMatches,
        }}
      />
      <Tab.Screen
        name={routes.tournaments}
        component={HomeScreens.TournamentsHome}
        options={{
          tabBarAccessibilityLabel: 'Tournaments',
          tabBarIcon: tabIconTournaments,
        }}
      />
      <Tab.Screen
        name={routes.profile}
        component={HomeScreens.Profile}
        options={{
          tabBarAccessibilityLabel: 'Profile and settings',
          tabBarIcon: tabIconProfile,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarItem: {
    flex: 1,
  },
  iconColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: heightPixel(2),
  },
  tabIcon: {
    width: widthPixel(22),
    height: widthPixel(22),
    marginBottom: heightPixel(4),
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabIconMuted: {
    opacity: 0.75,
  },
  tabLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
    letterSpacing: 0.15,
  },
  tabLabelFocused: {
    fontFamily: fontFamilies.bold,
  },
});
