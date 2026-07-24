"use client";

import { useEffect, useState } from "react";
import { messaging, db, doc, setDoc } from "@/lib/firebase";
import { getToken } from "firebase/messaging";

export default function NotificationPermission() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const requestPermission = async () => {
      try {
        if (!messaging) return;

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // VAPID 키는 Firebase 콘솔 -> 프로젝트 설정 -> 클라우드 메시징에서 생성 후 여기에 넣어야 합니다.
          // 임시로 공백이나 환경변수로 처리 가능하도록 구성
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

          if (!vapidKey) {
            console.warn("VAPID Key가 설정되지 않았습니다. 알림 토큰을 생성할 수 없습니다.");
            return;
          }

          const currentToken = await getToken(messaging, {
            vapidKey: vapidKey,
          });

          if (currentToken) {
            setToken(currentToken);
            saveTokenToFirestore(currentToken);
          } else {
            console.log("No registration token available. Request permission to generate one.");
          }
        }
      } catch (err) {
        console.error("An error occurred while retrieving token. ", err);
      }
    };

    const saveTokenToFirestore = async (fcmToken: string) => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        await setDoc(doc(db, "fcmTokens", userId), {
          token: fcmToken,
          updatedAt: new Date(),
        });
        console.log("FCM Token saved for user:", userId);
      }
    };

    requestPermission();
  }, []);

  return null; // UI 없이 백그라운드에서 동작
}
