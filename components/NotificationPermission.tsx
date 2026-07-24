"use client";

import { useEffect, useState } from "react";
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import axios from "axios";

export default function NotificationPermission() {
  const [permission, setPermission] = useState<string>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        alert("이 브라우저는 알림을 지원하지 않습니다.");
        return;
      }

      if (!messaging) {
        alert("Firebase 메시징 초기화에 실패했습니다.");
        return;
      }

      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === "granted") {
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
          await axios.post("/api/subscribe", { token: currentToken });
          alert("✅ 알림 구독이 완료되었습니다!");
        }
      } else if (status === "denied") {
        alert("알림 권한이 거부되었습니다. 설정에서 직접 허용해 주세요.");
      }
    } catch (err) {
      console.error("알림 설정 중 오류 발생:", err);
      alert("알림 설정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이미 허용되었거나 거부된 경우 버튼을 숨김
  if (permission !== "default") return null;

  return (
    <div className="w-full max-w-md mb-6 p-4 bg-blue-900/30 border border-blue-500 rounded-lg text-center">
      <p className="text-sm mb-3 text-blue-100">
        📅 새로운 일정을 실시간으로 받아보시겠습니까?
      </p>
      <button
        onClick={requestPermission}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-300 shadow-lg active:scale-95"
      >
        {loading ? "설정 중..." : "🔔 실시간 알림 켜기"}
      </button>
    </div>
  );
}
