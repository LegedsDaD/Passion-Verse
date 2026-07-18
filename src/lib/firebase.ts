import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "your_firebase_api_key_here" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "your_firebase_project_id_here"
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let dbFirestore: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    dbFirestore = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    // Swallow during SSR so the page can still render the "Sign in" UI.
    // The hook will surface a friendly message later.
    console.warn("Firebase initialization skipped or failed:", error);
  }
}

export { app, auth, dbFirestore, googleProvider };
