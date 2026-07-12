# Deploy PassionVerse to Vercel

## 1. Prepare Firebase

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Build → Authentication → Sign-in method**, enable **Google**.
3. In **Build → Firestore Database**, create a production database.
4. In **Project Settings → Your apps**, register a Web app and copy its Firebase configuration.
5. Add your eventual Vercel domain under **Authentication → Settings → Authorized domains**.
6. Deploy the included user-isolation rules with Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

The rules ensure each signed-in user can access only roadmap documents carrying their own Firebase UID.

## 2. Obtain API keys

### Gemini

1. Open [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create an API key.
3. Keep it private; it will be added as `GEMINI_API_KEY` in Vercel.

### ElevenLabs

1. Open [ElevenLabs](https://elevenlabs.io/).
2. Create or copy an API key from your profile.
3. Keep it private; it will be added as `ELEVENLABS_API_KEY` in Vercel.

ElevenLabs is optional. Browser speech is used automatically when the key is absent.

## 3. Import the repository into Vercel

1. Sign in at [vercel.com](https://vercel.com/).
2. Choose **Add New → Project**.
3. Import `LegedsDaD/Passion-Verse`.
4. Keep the detected Next.js framework settings.

## 4. Add Vercel Environment Variables

Open **Project → Settings → Environment Variables**. Add each name exactly as shown and select Production, Preview, and Development.

### Server-only secrets

```text
GEMINI_API_KEY
ELEVENLABS_API_KEY
```

### Firebase web configuration

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

The `NEXT_PUBLIC_` Firebase values identify your Firebase web app and are intended for browser use. Access is protected by Firebase Authentication and `firestore.rules`. Gemini and ElevenLabs keys do not use `NEXT_PUBLIC_` and remain server-only.

## 5. Deploy and verify

1. Click **Deploy**.
2. Open the deployed app and switch between light and dark themes.
3. Sign in with Google.
4. Open **Roadmaps** and confirm **My Roadmaps** is empty for a new account while **Example Roadmaps** shows fresh 0% examples.
5. Enter any passion or goal, answer all five questions, and generate a roadmap.
6. Return to **Roadmaps** and confirm it appears in **My Roadmaps**.
7. Open a roadmap step and test **Ask About This Step**.
8. Test voice playback.

No PostgreSQL database or `DATABASE_URL` is required.
