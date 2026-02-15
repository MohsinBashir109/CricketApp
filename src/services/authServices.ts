// src/services/firebaseAuth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  type Unsubscribe,
} from 'firebase/auth';

import { auth } from '../dbConfig/firebase';

// ---------- Types ----------
export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; code: string; message: string };

// ---------- Small helper to normalize errors ----------
const toAuthResultError = (err: unknown): AuthResult => {
  const anyErr = err as { code?: string; message?: string };
  const code = anyErr?.code ?? 'auth/unknown';
  const message = anyErr?.message ?? 'Something went wrong. Please try again.';
  return { ok: false, code, message };
};

// ---------- Sign In ----------
export const handleSignIn = async (
  email: string,
  password: string,
): Promise<AuthResult> => {
  try {
    const res = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { ok: true, user: res.user };
  } catch (err) {
    return toAuthResultError(err);
  }
};

// ---------- Sign Up (optional displayName) ----------
export const handleSignUp = async (
  email: string,
  password: string,
  userName?: string,
): Promise<AuthResult> => {
  try {
    const res = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

    // Optional: set user's display name
    if (userName?.trim()) {
      await updateProfile(res.user, { displayName: userName.trim() });
    }

    return { ok: true, user: res.user };
  } catch (err) {
    console.log(err);

    return toAuthResultError(err);
  }
};

// ---------- Sign Out ----------
export const handleSignOut = async (): Promise<{ ok: true } | AuthResult> => {
  try {
    await signOut(auth);
    return { ok: true };
  } catch (err) {
    return toAuthResultError(err);
  }
};

// ---------- Current user ----------
export const getCurrentUser = (): User | null => auth.currentUser;

// ---------- Listener (use in Splash or app bootstrap) ----------
export const listenAuthState = (
  cb: (user: User | null) => void,
): Unsubscribe => {
  return onAuthStateChanged(auth, cb);
};
