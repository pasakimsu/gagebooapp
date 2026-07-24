"use client";

import { useEffect, useState } from "react";
import { messaging } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import axios from "axios";

export default function NotificationPermission() {
  const [permission, setPermission] = useState<string>("default");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id);

    if (typeof window !== "undefined" && "Notification" in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      if (currentPermission === "granted") {
        autoSubscribe();
      }
    }

    // ... existing onMessage listener ...

    // 🔔 앱이 켜져 있을 때(포그라운드) 알림 수신 처리
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message:", payload);
        // alert 제거 -> 콘솔 로그만 유지 (안정성)
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
        const res = await axios.post<{ success: boolean; subscribed: boolean }>("/api/subscribe", {
          token: currentToken,
          userId: localStorage.getItem("userId") || "guest"
        });
        if (res.data.success) {
          setIsSubscribed(res.data.subscribed);
        }
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
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        await navigator.serviceWorker.ready;

        if (!messaging) {
          alert("Firebase 메시징 초기화에 실패했습니다.");
          return;
        }

        const status = await Notification.requestPermission();
        setPermission(status);

        if (status === "granted") {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) return;

          // 2. 토큰 가져오기 (등록 객체를 명시적으로 전달)
          const currentToken = await getToken(messaging, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration
          });

          if (currentToken) {
            console.log("획득한 토큰:", currentToken);
            const userId = localStorage.getItem("userId") || "guest";
            const res = await axios.post<{ success: boolean; subscribed: boolean }>("/api/subscribe", {
              token: currentToken,
              userId
            });

            if (res.data.success) {
              setIsSubscribed(res.data.subscribed);
              alert("✅ 알림 설정이 완료되었습니다!");
            }
          }
        } else if (status === "denied") {
          alert("알림 권한이 거부되었습니다. 설정에서 직접 허용해 주세요.");
        }
      } else {
        alert("서비스 워커를 지원하지 않는 브라우저입니다.");
      }
    } catch (err) {
      console.error("알림 설정 중 오류 발생:", err);
      alert("알림 설정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async () => {
    setLoading(true);
    try {
      if (!messaging) return;
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      const currentToken = await getToken(messaging, { vapidKey });

      if (currentToken) {
        const nextState = !isSubscribed;
        const res = await axios.post<{ success: boolean; subscribed: boolean }>("/api/subscribe", {
          token: currentToken,
          userId,
          action: nextState ? "subscribe" : "unsubscribe"
        });

        if (res.data.success) {
          setIsSubscribed(res.data.subscribed);
          alert(res.data.subscribed ? "🔔 알림이 켜졌습니다." : "🔕 알림이 꺼졌습니다.");
        }
      }
    } catch (e) {
      alert("알림 설정 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 권한이 거부된 경우 아무것도 표시하지 않음
  if (permission === "denied") return null;

  return (
    <div className="w-full max-w-md mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl text-center shadow-inner">
      {permission === "default" ? (
        <>
          <p className="text-sm mb-3 text-blue-100/80">
            📅 실시간 일정 알림을 받으시겠습니까?
          </p>
          <button
            onClick={requestPermission}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-full transition duration-300 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? "설정 중..." : "🔔 알림 권한 허용하기"}
          </button>
        </>
      ) : permission === "granted" ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full px-4">
            <span className="text-sm font-medium text-blue-100">
              {isSubscribed ? "🔔 실시간 알림 수신 중" : "🔕 알림 수신 꺼짐"}
            </span>

            {/* 세련된 토글 스위치 */}
            <button
              onClick={toggleSubscription}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isSubscribed ? "bg-blue-500" : "bg-gray-600"
              } ${loading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSubscribed ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 관리자(admin) 전용 테스트 버튼 */}
          {userId === "admin" && (
            <div className="w-full pt-2 border-t border-blue-500/20 mt-1">
              <button
                onClick={async () => {
                  try {
                    const res = await axios.post<{ success: boolean }>("/api/notify", {
                      title: "🔔 [관리자 테스트]",
                      body: "시스템 알림이 정상 작동 중입니다.",
                    });
                    if (res.data.success) {
                      setDebugInfo("테스트 알림 발송 성공! 앱을 끄고 확인하세요.");
                      setTimeout(() => setDebugInfo(""), 5000);
                    }
                  } catch (e: any) {
                    alert(`❌ 전송 실패: ${e.response?.data?.error || "알 수 없는 오류"}`);
                  }
                }}
                className="text-xs text-blue-300 hover:text-blue-100 underline decoration-dotted underline-offset-4"
              >
                관리자 전송 테스트
              </button>
              {debugInfo && <p className="mt-2 text-[10px] text-yellow-300 animate-pulse">{debugInfo}</p>}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
