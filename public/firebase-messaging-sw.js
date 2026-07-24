importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAndxmjKRA3ZDrOZ0aALjnTPFHC7Q-jpXw",
  authDomain: "gaguiboo.firebaseapp.com",
  projectId: "gaguiboo",
  storageBucket: "gaguiboo.firebasestorage.app",
  messagingSenderId: "545475332778",
  appId: "1:545475332778:web:c879423ce3010694805ed3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/next.svg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
