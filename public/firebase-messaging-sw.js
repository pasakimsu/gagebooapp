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

// 백그라운드 메시지 핸들러 (Firebase 라이브러리 방식)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || "우리집 가계부";
  const notificationOptions = {
    body: payload.notification?.body || "새로운 일정이 등록되었습니다.",
    icon: '/next.svg',
    badge: '/next.svg',
    tag: 'family-notification',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 브라우저 네이티브 push 이벤트 가로채기 (백업용)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Native push event received:', data);

    // Firebase가 이미 처리하지 않은 경우에만 수동으로 표시
    if (data.notification) {
      const title = data.notification.title || "우리집 가계부";
      const options = {
        body: data.notification.body,
        icon: '/next.svg',
        badge: '/next.svg',
        data: data.data
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  }
});

// 알림 클릭 시 앱으로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});
