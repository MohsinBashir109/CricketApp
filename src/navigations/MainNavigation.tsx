import * as Auth from '../screens/AuthStack/AuthStack';

import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';

import { AuthNavigation } from './authstack/AuthNavigation';
import { HomeNavigation } from './homestack/homeNavigation';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { routes } from '../utils/routes';

const MyStack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

export const MainNavigator = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <MyStack.Navigator screenOptions={{ headerShown: false }}>
        <MyStack.Screen name={routes.auth} component={AuthNavigation} />
        <MyStack.Screen name={routes.home} component={HomeNavigation} />
      </MyStack.Navigator>
    </NavigationContainer>
  );
};
