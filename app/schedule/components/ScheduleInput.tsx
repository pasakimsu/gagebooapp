"use client";

import { useEffect, useState } from "react";
import { db, collection, addDoc, getDocs, query, where, deleteDoc, doc } from "@/lib/firebase";
import axios from "axios";

interface Props {
  selectedRange: [Date, Date];
  onRegister: () => void;
}

export default function ScheduleInput({ selectedRange, onRegister }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
  }, []);

  const sendNotification = async (text: string, dateInfo: string) => {
    try {
      const safeDate = dateInfo || "일자미상";
      const messageBody = `${userId || "가족"}님이 ${safeDate} [${text}] 일정을 등록했습니다.`;

      await axios.post("/api/notify", {
        title: "📅 새로운 일정 등록",
        body: messageBody,
      });
      console.log("Broadcast notification sent:", messageBody);
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !userId) {
      alert("내용을 입력하세요.");
      return;
    }

    setLoading(true); // 중복 클릭 방지 시작

    const [startDate, endDate] = selectedRange;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];

    // 알림용 날짜 텍스트 생성 (확실하게 Date 객체로 변환 후 포맷팅)
    const s = new Date(startDate);
    const e = new Date(endDate);
    const isSameDay = s.getFullYear() === e.getFullYear() &&
                     s.getMonth() === e.getMonth() &&
                     s.getDate() === e.getDate();

    const dateInfo = isSameDay
      ? `${s.getMonth() + 1}월 ${s.getDate()}일`
      : `${s.getMonth() + 1}/${s.getDate()}~${e.getMonth() + 1}/${e.getDate()}`;

    console.log("알림 전송 데이터:", { userId, dateInfo, content: content.trim() });

    while (start <= end) {
      const dateStr = start
        .toLocaleDateString("ko-KR")
        .replaceAll(". ", "-")
        .replace(".", "");
      dates.push(dateStr);
      start.setDate(start.getDate() + 1);
    }

    try {
      // 1. DB 저장을 먼저 병렬로 처리하여 속도 향상
      const savePromises = dates.map(date =>
        addDoc(collection(db, "schedules"), {
          date,
          content: `${content.trim()} (${userId})`,
          userId,
          createdAt: new Date(),
        })
      );

      await Promise.all(savePromises);

      // 2. 알림 전송은 'await' 하지 않고 백그라운드에서 실행 (UI 반응속도 향상)
      sendNotification(content.trim(), dateInfo);

      // 3. 즉시 UI 업데이트
      setContent("");
      onRegister();
      // alert은 사용자 흐름을 끊으므로 성공 시에는 생략하거나 토스트로 대체하는 것이 좋지만,
      // 일단 기존 스타일 유지를 위해 짧은 딜레이 후 노출
    } catch (err) {
      console.error("❌ 등록 오류:", err);
      alert("❌ 등록 중 문제가 발생했습니다.");
    } finally {
      setLoading(false); // 로딩 해제
    }
  };

  const [startDate, endDate] = selectedRange;
  const formattedRange = `${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()}`;

  return (
    <div className="mt-6 w-full max-w-md">
      <p className="mb-2">선택한 날짜 범위: <strong>{formattedRange}</strong></p>
      <input
        type="text"
        placeholder="일정 내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 rounded bg-gray-700 text-white placeholder-gray-400 mb-2"
        disabled={loading}
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full font-bold py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-md ${
          loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#8d7864] hover:bg-[#a48d77] text-white"
        }`}
      >
        {loading ? "처리 중..." : "일정 등록"}
      </button>
    </div>
  );
}
