# Firebase Notifications — how to enable them in PassionVerse

PassionVerse ships with two complementary notification paths. **Path A** works
out of the box (local, in-tab reminders). **Path B** gives true background
push and only needs a few extra steps in the Firebase console.

---

## Path A — Local in-tab reminders (zero setup)

1. Open PassionVerse, sign in with Google.
2. Open any roadmap → **Timetable** tab → click **Enable all** (or toggle
   individual rows with the bell icon).
3. Allow the browser notification prompt.

While that tab is open, the app schedules each session via `setTimeout` and
fires a system notification when the time arrives. Close the tab and the
reminders stop — that's the only limitation of Path A.

No environment variables, no service worker config, no Cloud Function needed.

---

## Path B — Background push via Firebase Cloud Messaging

Background push lets notifications arrive even when the app is closed. It
requires four small steps.

### 1. Turn on Cloud Messaging in the Firebase console

1. Open [Firebase Console](https://console.firebase.google.com/) → your
   project → **Project settings** (gear icon) → **Cloud Messaging** tab.
2. Under **Web configuration**, click **Generate key pair** if you haven't
   already. This produces a **Web Push certificate (VAPID key)** — a long
   base64 string. Copy it.
3. In your Vercel project, add an environment variable:

   ```
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=<paste-the-VAPID-key>
   ```

   This is a public key — safe to expose to the browser — but we still keep
   it in env vars so it stays in one place.

4. Redeploy.

### 2. Register the service worker

PassionVerse already ships a service worker at `public/firebase-messaging-sw.js`.
Open that file and replace the six `REPLACE_ME` values in `firebaseConfig`
with the same values you use in your `NEXT_PUBLIC_FIREBASE_*` env vars.
(Yes, duplication — service workers run in a separate scope and can't read
`process.env`. Keep the two in sync.)

The service worker is registered automatically the first time the user
clicks **Enable notifications** in Settings → Timetable reminders.

### 3. Deploy the Firestore rules

The rules already include `userTokens/{uid}`. Push them:

```bash
npm i -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

After this step, every user who enables notifications has a document at
`userTokens/{uid}` containing their FCM token.

### 4. Send the push (Cloud Function)

This is the only piece you write yourself — a scheduled Cloud Function
that reads the `roadmaps` collection, finds timetable rows whose
`notifyAt` falls within the next few minutes, looks up the owner's FCM
token in `userTokens/{ownerUid}`, and sends a message via the Admin SDK.

A minimal skeleton:

```js
// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendDueReminders = functions.pubsub.schedule("every 5 minutes").onRun(async () => {
  const now = new Date();
  const inFive = new Date(now.getTime() + 5 * 60 * 1000);
  const snap = await admin.firestore().collection("roadmaps").get();
  const due = [];
  snap.forEach((doc) => {
    const data = doc.data();
    const rows = data.payload?.timetable ?? [];
    rows.forEach((row) => {
      if (!row.notifyAt || !row.notified) return;
      const at = new Date(row.notifyAt);
      if (at >= now && at < inFive) {
        due.push({ userId: data.userId, row });
      }
    });
  });

  await Promise.all(
    due.map(async ({ userId, row }) => {
      const tokenDoc = await admin.firestore().collection("userTokens").doc(userId).get();
      const token = tokenDoc.get("fcmToken");
      if (!token) return;
      try {
        await admin.messaging().send({
          token,
          notification: { title: row.title, body: row.description },
          data: { url: "/" },
        });
      } catch (e) {
        functions.logger.warn("Push failed", e);
      }
    })
  );
});
```

Deploy with `firebase deploy --only functions`. Enable the Cloud Scheduler
API and the Cloud Functions API in the Google Cloud console if prompted.

---

## Verifying it works

1. In the Firebase console → **Cloud Messaging** → **Send your first
   message**, target the FCM token you see in `userTokens/{yourUid}`. You
   should see the notification on your device within a few seconds.
2. For scheduled reminders: in the Cloud Functions logs, confirm
   `sendDueReminders` runs every 5 minutes without errors.
3. In the app: Timetable tab → enable a session that's a few minutes out →
   wait → notification arrives even with the tab closed.

---

## Disabling

- **User side**: Settings → Timetable reminders → *Allow in browser* /
  *Blocked in browser* toggle, or per-roadmap Timetable tab → **Enable all**
  button becomes a kill switch.
- **Server side**: delete the `userTokens/{uid}` document; the Cloud
  Function skips users without a token.
