importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// These values are often available in firebase-applet-config.json
// But since this is a static file in public/, we might need to hardcode or use a template
// I'll use placeholders that the user might need to fill or I can try to extract from the config
firebase.initializeApp({
  apiKey: "AIzaSyAnjiQExY44yht2C2DjV_PliHq9jGO6vPI",
  authDomain: "nacero-8199e.firebaseapp.com",
  projectId: "nacero-8199e",
  storageBucket: "nacero-8199e.firebasestorage.app",
  messagingSenderId: "362369948125",
  appId: "1:362369948125:web:c73d4507a1714a1f18be34"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // customize as needed
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
