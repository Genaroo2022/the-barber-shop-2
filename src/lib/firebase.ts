import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase no configurado");
  }

  if (!app) {
    app = initializeApp(config);
  }

  if (!auth) {
    auth = getAuth(app);
  }

  return auth;
}

export async function signInWithGooglePopup(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  return result.user;
}

export async function signOutFirebaseIfConfigured(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // ignore
  }
}

