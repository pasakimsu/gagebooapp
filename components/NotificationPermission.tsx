"use client";

import { useEffect } from "react";
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import axios from "axios";

export default function NotificationPermission() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (!messaging) return;

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

          if (!vapidKey) {
            console.warn("VAPID Key가 설정되지 않았습니다.");
            return;
          }

          const currentToken = await getToken(messaging, {
            vapidKey: vapidKey,
          });

          if (currentToken) {
            console.log("FCM Token 획득 성공");
            // 서버에 구독 요청 (family 주제)
            await axios.post("/api/subscribe", { token: currentToken });
            console.log("알림 구독 완료 (family topic)");
          }
        }
      } catch (err) {
        console.error("알림 설정 중 오류 발생:", err);
      }
    };

    setupNotifications();
  }, []);

  return null;
}
