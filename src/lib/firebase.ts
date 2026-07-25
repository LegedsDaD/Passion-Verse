import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

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
    const isFirstInit = !getApps().length;
    app = isFirstInit ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    // Roadmaps carry optional fields (questionMarkdown, timetable, per-row
    // `notified` flags, per-step description, etc). Firestore v10 rejects
    // any `undefined` in the payload by default, which is exactly why saves
    // were failing silently. `ignoreUndefinedProperties: true` strips them
    // on write so partial objects always persist correctly.
    if (isFirstInit) {
      try {
        dbFirestore = initializeFirestore(app, {
          ignoreUndefinedProperties: true,
        });
      } catch {
        // initializeFirestore throws if it has already been called for this
        // app (e.g. during Fast Refresh). Fall back to the existing instance.
        dbFirestore = getFirestore(app);
      }
    } else {
      dbFirestore = getFirestore(app);
    }

    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    // Swallow during SSR so the page can still render the "Sign in" UI.
    // The hook will surface a friendly message later.
    console.warn("Firebase initialization skipped or failed:", error);
  }
}

export { app, auth, dbFirestore, googleProvider };
