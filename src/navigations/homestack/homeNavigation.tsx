import * as Home from '../../screens/HomeStack/HomeStack';

import React, { useEffect, useState } from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { routes } from '../../utils/routes';

const AuthStack = createNativeStackNavigator();

export const HomeNavigation = () => {
  return (
    <AuthStack.Navigator
      initialRouteName={routes.home}
      screenOptions={{
        headerShown: false,
        // cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
      }}
    >
      <AuthStack.Screen name={routes.home} component={Home.Home} />
    </AuthStack.Navigator>
  );
};
