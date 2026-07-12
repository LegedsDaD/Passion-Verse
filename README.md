# PassionVerse

**Turn Your Passion Into a Personalized Journey.**

Tell PassionVerse what you want to do—learn a skill, improve a habit, train for a goal, plan an experience, grow a career, start a business, or complete a project. Gemini asks five focused questions and turns the answers into a practical roadmap you can follow.

Contributors: LegedsDaD and AmitManna99

## How it works

1. Describe what you want to do or achieve.
2. Gemini creates exactly five questions for that goal.
3. Answer each question one at a time.
4. Review the five-answer bundle.
5. Gemini creates the personalized roadmap.
6. Follow the steps, track milestones, and ask the AI mentor when needed.

## Features

- Five-question adaptive Gemini interview
- Personalized steps, schedule, budget, resources, and milestones
- **My Roadmaps** and **Example Roadmaps** dashboard sections
- Fresh example roadmaps at 0% progress
- Per-step **Ask About This Step** mentor
- ElevenLabs voice through a secure server route
- Firebase Google Sign-In and Firestore roadmap storage
- Local browser fallback when a user is not signed in
- Responsive light and dark themes
- Vercel-ready configuration

## Environment variables

Copy `.env.example` to `.env` for local development. In production, add the same variables under **Vercel → Project Settings → Environment Variables**.

```text
GEMINI_API_KEY
ELEVENLABS_API_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Gemini and ElevenLabs keys remain server-only. Firebase web configuration is protected by Firebase Authentication and the included `firestore.rules`.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

## Firestore rules

```bash
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

## Deploy

Import [the Passion-Verse repository](https://github.com/LegedsDaD/Passion-Verse) into Vercel, add the variables above, then deploy. See `DEPLOYMENT_GUIDE.md` for the full checklist.

No PostgreSQL database or `DATABASE_URL` is required.
