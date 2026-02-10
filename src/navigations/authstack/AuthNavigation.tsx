import * as Auth from '../../screens/AuthStack/AuthStack';

import React, { useEffect, useState } from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { routes } from '../../utils/routes';

const AuthStack = createNativeStackNavigator();

export const AuthNavigation = () => {
  return (
    <AuthStack.Navigator
      initialRouteName={routes.splash}
      screenOptions={{
        headerShown: false,
        // cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
      }}
    >
      <AuthStack.Screen name={routes.splash} component={Auth.Splash} />
      <AuthStack.Screen name={routes.signIn} component={Auth.Signin} />
      <AuthStack.Screen name={routes.signUp} component={Auth.Signup} />
    </AuthStack.Navigator>
  );
};
