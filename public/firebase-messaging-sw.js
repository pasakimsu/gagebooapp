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
// Note: notification 페이로드가 포함된 푸시는 FCM SDK에서 자동 알림 창을 띄우므로,
// 수동 showNotification 중복 호출을 제거하여 알림이 1개만 오도록 고정합니다.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // notification 객체가 없는 data-only 푸시인 경우에만 수동으로 1회 표시
  if (!payload.notification && payload.data) {
    const notificationTitle = payload.data.title || "우리집 가계부";
    const notificationOptions = {
      body: payload.data.body || "새로운 일정이 등록되었습니다.",
      icon: '/next.svg',
      badge: '/next.svg',
      tag: 'family-notification',
      data: payload.data
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
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
