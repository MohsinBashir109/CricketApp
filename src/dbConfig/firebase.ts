// @ts-ignore

import { getApp, getApps, initializeApp } from 'firebase/app';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence } from 'firebase/auth';
import { initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCtp1UGKB-mfwtryAYW8969QdOTlO03sZs',
  authDomain: 'cricketapp-6f24b.firebaseapp.com',
  projectId: 'cricketapp-6f24b',
  storageBucket: 'cricketapp-6f24b.firebasestorage.app',
  messagingSenderId: '629094445826',
  appId: '1:629094445826:android:361783360f3a705c8ec81b',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ This is what makes login persist after app restart
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
