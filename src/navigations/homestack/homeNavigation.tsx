import * as Home from '../../screens/HomeStack/HomeStack';

import React, { useEffect, useState } from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { routes } from '../../utils/routes';
import { BottomTabs } from './bottomNavigation';

const HomeStack = createNativeStackNavigator();

export const HomeNavigation = () => {
  return (
    <HomeStack.Navigator
     
      screenOptions={{
        headerShown: false,
        // cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
      }}
    >
      <HomeStack.Screen name={routes.myTabs} component={BottomTabs} />
      <HomeStack.Screen name={routes.startMatch} component={Home.Startmatch} />
    </HomeStack.Navigator>
  );
};
