import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
} from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyCtp1UGKB-mfwtryAYW8969QdOTlO03sZs",
  authDomain: "cricketapp-6f24b.firebaseapp.com",
  projectId: "cricketapp-6f24b",
  storageBucket: "cricketapp-6f24b.firebasestorage.app",
  messagingSenderId: "629094445826",
  appId: "1:629094445826:android:361783360f3a705c8ec81b",
};



export const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();


export const auth = getAuth(app);
