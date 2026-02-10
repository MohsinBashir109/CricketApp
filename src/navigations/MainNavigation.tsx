import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';

import { ThemeProvider } from '../theme/themeContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { routes } from '../utils/routes';

const MyStack = createNativeStackNavigator();

// Create navigation reference for use outside components
export const navigationRef = createNavigationContainerRef();

export const MainNavigator = () => {
  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <MyStack.Navigator screenOptions={{ headerShown: false }}>
          {/* <MyStack.Screen
            name={routes.onboarding}
            component={HomeScreens.Onboarding}
          /> */}
        </MyStack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
};
