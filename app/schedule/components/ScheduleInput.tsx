"use client";

import { useEffect, useState } from "react";
import { db, collection, addDoc } from "@/lib/firebase";
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
      // 날짜가 혹시 없더라도 기본값 보장
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
      for (const date of dates) {
        await addDoc(collection(db, "schedules"), {
          date,
          content: `${content.trim()} (${userId})`,
          userId,
          createdAt: new Date(),
        });
      }

      // 알림 전송 (상세 정보 포함)
      await sendNotification(content.trim(), dateInfo);

      alert("✅ 등록 완료!");
      setContent("");
      onRegister();
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
        className={`w-full font-bold py-2 rounded transition duration-300 ${
          loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#8d7864] hover:bg-[#a48d77] text-white"
        }`}
      >
        {loading ? "등록 중..." : "일정 등록"}
      </button>
    </div>
  );
}
