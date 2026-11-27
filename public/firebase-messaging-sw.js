importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// 서비스 워커 즉시 활성화
self.addEventListener('install', () => {
  self.skipWaiting();
});

firebase.initializeApp({
  apiKey: "AIzaSyAndxmjKRA3ZDrOZ0aALjnTPFHC7Q-jpXw",
  authDomain: "gaguiboo.firebaseapp.com",
  projectId: "gaguiboo",
  storageBucket: "gaguiboo.firebasestorage.app",
  messagingSenderId: "545475332778",
  appId: "1:545475332778:web:c879423ce3010694805ed3",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || "우리집 가계부";
  const notificationBody = payload.notification?.body || payload.data?.body || "새로운 일정이 등록되었습니다.";

  const notificationOptions = {
    body: notificationBody,
    icon: '/next.svg',
    badge: '/next.svg',
    tag: 'family-notification', // tag 속성으로 동일 알림 중복 결합
    data: payload.data || payload.notification
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 시 앱 화면으로 즉시 전환
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});
