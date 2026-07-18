/* eslint-disable no-restricted-globals */
// Firebase Cloud Messaging service worker. Loaded from /firebase-messaging-sw.js
// by firebase-messaging.ts when the user enables notifications. It renders
// background push messages as system notifications.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// IMPORTANT: replace these values with your own Firebase web-app config.
// They must match the values you set in your Vercel environment so the
// token issued here matches the project that sends the push.
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

// Only initialise if the values have been swapped in; otherwise this file
// stays inert and local in-tab notifications from firebase-messaging.ts
// continue to work without push.
if (firebaseConfig.apiKey !== "REPLACE_ME") {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "PassionVerse";
    const options = {
      body: payload?.notification?.body || "",
      icon: "/passionverse-logo.png",
      data: payload?.data || {},
    };
    self.registration.showNotification(title, options);
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const target = event.notification?.data?.url || "/";
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.endsWith(target) && "focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
    );
  });
}
