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
import { persistor, store } from './src/features/store/store';
import { use, useEffect } from 'react';

import { MainNavigator } from './src/navigations/MainNavigation';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '../CricketApp/src/theme/themeContext';
import { app } from './src/dbConfig/firebase';

function App() {
  useEffect(() => {
    console.log('App mounted', app);
  }, []);
  LogBox.ignoreAllLogs();
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <MainNavigator />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
