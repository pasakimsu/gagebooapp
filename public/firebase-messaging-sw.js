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

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // 알림 내용 추출
  const notificationTitle = payload.notification?.title || "우리집 가계부";
  const notificationOptions = {
    body: payload.notification?.body || "새로운 알림이 있습니다.",
    icon: '/next.svg', // 아이콘 경로 확인 필요
    badge: '/next.svg',
    tag: 'family-notification', // 같은 태그의 알림은 덮어씌움 (스택 관리용)
    renotify: true,
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 핸들러
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
