// src/navigation/HomeFlow/BottomTabs.tsx
import React from "react";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as HomeScreens from "../../screens/HomeStack/HomeStack";


import { routes } from "../../utils/routes";
import { homeIcon,profile,matches } from "../../assets/images";
import { heightPixel,widthPixel ,fontPixel} from "../../utils/constants";
import LinearGradient from "react-native-linear-gradient";




const Tab = createBottomTabNavigator();

type TabIconProps = {
  focused: boolean;
  label: string;
  source: any;
};

const TabIcon = ({ focused, label, source }: TabIconProps) => {
  return (
    <View style={[styles.iconWrap, focused ? styles.iconWrapFocused : null]}>
      {focused ? (
        <LinearGradient
          colors={["#90DDF6", "#3D84F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Image source={source} style={styles.iconFocused} />
        </LinearGradient>
      ) : (
        <Image source={source} style={styles.icon} />
      )}
      
      <View style={{ width: widthPixel(50), alignItems: "center" }}>
        <Text style={[styles.label, focused ? styles.labelFocused : null]} numberOfLines={1}  >
        {label}
      </Text>
      </View>
    </View>
  );
};

export const BottomTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName={routes.home}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          height:
            Platform.OS === "android"
              ? 60 + insets.bottom
              : 55 + insets.bottom,
          paddingTop: Platform.OS === "ios" ? 10 : 0,
        },
      }}
    >
      <Tab.Screen
        name={routes.home}
        component={HomeScreens.Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Home" source={homeIcon} />
          ),
        }}
      />

      

      <Tab.Screen
        name={routes.matches}
        component={HomeScreens.Matches}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Matches" source={matches} />
          ),
        }}
      />
<Tab.Screen
        name={routes.profile}
        component={HomeScreens.Profile}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Profile" source={profile} />
          ),
        }}
      />
      

     
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: heightPixel(10),
  },
  iconWrapFocused: {
    marginTop: 0,
  },
  gradient: {
    borderRadius: widthPixel(999),
    padding: widthPixel(10),
    marginBottom: heightPixel(6),
  },
  icon: {
    width: widthPixel(22),
    height: heightPixel(22),
    resizeMode: "contain",
    marginBottom: heightPixel(6),
    opacity: 0.7,
  },
  iconFocused: {
    width: widthPixel(22),
    height: heightPixel(22),
    resizeMode: "contain",
    tintColor: "white",
  },
  label: {
    fontSize: fontPixel(10),
    color: "#777",
  },
  labelFocused: {
    fontSize: fontPixel(10),
    color: "#3D84F6",
    fontWeight: "700",
  },
});
