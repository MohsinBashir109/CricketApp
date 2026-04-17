import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';

import React, { Fragment } from 'react';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthNavigation } from './authstack/AuthNavigation';
import { HomeNavigation } from './homestack/homeNavigation';
// import { useThemeContext } from '../theme/themeContext';
import { routes } from '../utils/routes';

const MyStack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

export const MainNavigator = () => {
  // const { isDark } = useThemeContext();

  return (
    <Fragment>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <NavigationContainer ref={navigationRef}>
        <MyStack.Navigator screenOptions={{ headerShown: false }}>
          <MyStack.Screen name={routes.auth} component={AuthNavigation} />
          <MyStack.Screen name={routes.home} component={HomeNavigation} />
        </MyStack.Navigator>
      </NavigationContainer>
    </Fragment>
  );
};
