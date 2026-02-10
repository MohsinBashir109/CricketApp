/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {
  LogBox,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { use, useEffect } from 'react';

import { MainNavigator } from './src/navigations/MainNavigation';
import { ThemeProvider } from '../CricketApp/src/theme/themeContext';
import { logFirebaseApp } from './src/dbConfig/firebase';

function App() {
  useEffect(() => {
    logFirebaseApp();
  }, []);
  LogBox.ignoreAllLogs();
  return (
    <ThemeProvider>
      <MainNavigator />
    </ThemeProvider>
  );
}

export default App;
