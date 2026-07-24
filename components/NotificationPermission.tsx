"use client";

import { useEffect, useState } from "react";
import { messaging } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import axios from "axios";

export default function NotificationPermission() {
  const [permission, setPermission] = useState<string>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      // 이미 허용된 상태라면 자동으로 토큰 확인 및 구독 유지
      if (currentPermission === "granted") {
        autoSubscribe();
      }
    }

    // 🔔 앱이 켜져 있을 때(포그라운드) 알림 수신 처리
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message:", payload);
        alert(`🔔 [알림] ${payload.notification?.title}\n\n${payload.notification?.body}`);
      });
      return () => unsubscribe();
    }
  }, [messaging]);

  const autoSubscribe = async () => {
    try {
      if (!messaging) return;

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) return;

      const currentToken = await getToken(messaging, { vapidKey });
      if (currentToken) {
        // 서버에 구독 및 Firestore 저장 요청
        await axios.post("/api/subscribe", {
          token: currentToken,
          userId: localStorage.getItem("userId") || "guest"
        });
      }
    } catch (e) {
      console.error("자동 구독 확인 실패:", e);
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        alert("이 브라우저는 알림을 지원하지 않습니다.");
        return;
      }

      // 1. 서비스 워커 명시적 등록 및 대기 (iOS 필수)
      let registration: ServiceWorkerRegistration;
      if ("serviceWorker" in navigator) {
        registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        // 서비스 워커가 준비될 때까지 잠시 대기
        await navigator.serviceWorker.ready;
      } else {
        alert("서비스 워커를 지원하지 않는 브라우저입니다.");
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

        // 2. 토큰 가져오기 (등록 객체를 명시적으로 전달)
        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });

        if (currentToken) {
          console.log("획득한 토큰:", currentToken);
          const userId = localStorage.getItem("userId") || "guest";
          const res = await axios.post<{ success: boolean }>("/api/subscribe", {
            token: currentToken,
            userId
          });

          if (res.data.success) {
            alert("✅ 알림 설정 완료! 이제 앱을 끄고 PC에서 테스트해보세요.");
          }
        }
      }
else if (status === "denied") {
        alert("알림 권한이 거부되었습니다. 설정에서 직접 허용해 주세요.");
      }
    } catch (err) {
      console.error("알림 설정 중 오류 발생:", err);
      alert("알림 설정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 권한이 거부된 경우 아무것도 표시하지 않음
  if (permission === "denied") return null;

  return (
    <div className="w-full max-w-md mb-6 p-4 bg-blue-900/30 border border-blue-500 rounded-lg text-center">
      {permission === "default" ? (
        <>
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
        </>
      ) : permission === "granted" ? (
        <button
          onClick={async () => {
            try {
              const res = await axios.post<{ success: boolean }>("/api/notify", {
                title: "🔔 테스트 알림",
                body: "알림이 정상적으로 작동합니다!",
              });
              if (res.data.success) {
                alert("테스트 알림을 보냈습니다. 앱을 끄고 기다려 보세요.");
              }
            } catch (e: any) {
              const errorMsg = e.response?.data?.error || "알림 전송 실패";
              const details = e.response?.data?.details || "";
              alert(`❌ ${errorMsg}\n${details}`);
              console.error("Test notification failed:", e.response?.data);
            }
          }}
          className="text-sm text-blue-300 hover:text-blue-100 flex items-center justify-center gap-2 mx-auto"
        >
          <span>✅ 알림 구독 중</span>
          <span className="underline text-xs">(전송 테스트)</span>
        </button>
      ) : null}
    </div>
  );
}
