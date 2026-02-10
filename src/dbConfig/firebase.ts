import { getApp, getApps } from '@react-native-firebase/app';

export const logFirebaseApp = () => {
  try {
    const app = getApps().length ? getApp() : null;

    if (!app) {
      console.log('❌ No Firebase app initialized yet');
      return;
    }

    console.log('🔥 Firebase App Name:', app.name);
    console.log('🔥 Firebase Options:', app.options);
    console.log('🔥 Project ID:', app.options.projectId);
  } catch (e) {
    console.log('❌ Firebase log failed:', e);
  }
};
