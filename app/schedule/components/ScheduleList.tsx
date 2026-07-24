"use client";

import { useEffect, useState } from "react";
import { db, collection, onSnapshot, deleteDoc, doc, getDocs, query, where } from "@/lib/firebase";
import axios from "axios";

interface Props {
  selectedRange: [Date, Date];
  refreshKey: number;
  onRefresh: () => void;
}

interface ScheduleData {
  id: string;
  date: string;
  content: string;
}

const SOLAR_ANNIVERSARIES: Record<string, string> = {
  "12-06": "🎂 재현생일",
  "10-26": "🎂 용휘생일",
  "01-13": "🎂 서한생일",
  "07-06": "💍 결혼기념일",
};

const LUNAR_ANNIVERSARIES: Record<string, string[]> = {
  "2025-11-26": ["🎂 시부생신(음력 10.07)"], "2026-11-15": ["🎂 시부생신(음력 10.07)"], "2027-11-04": ["🎂 시부생신(음력 10.07)"],
  "2028-11-22": ["🎂 시부생신(음력 10.07)"], "2029-11-12": ["🎂 시부생신(음력 10.07)"], "2030-11-02": ["🎂 시부생신(음력 10.07)"],
  "2031-11-20": ["🎂 시부생신(음력 10.07)"], "2032-11-09": ["🎂 시부생신(음력 10.07)"], "2033-11-28": ["🎂 시부생신(음력 10.07)"],
  "2034-11-17": ["🎂 시부생신(음력 10.07)"], "2035-11-06": ["🎂 시부생신(음력 10.07)"],

  "2025-07-09": ["🎂 시모생신(음력 06.15)"], "2026-07-28": ["🎂 시모생신(음력 06.15)"], "2027-07-18": ["🎂 시모생신(음력 06.15)"],
  "2028-08-05": ["🎂 시모생신(음력 06.15)"], "2029-07-26": ["🎂 시모생신(음력 06.15)"], "2030-07-15": ["🎂 시모생신(음력 06.15)"],
  "2031-08-02": ["🎂 시모생신(음력 06.15)"], "2032-07-22": ["🎂 시모생신(음력 06.15)"], "2033-07-11": ["🎂 시모생신(음력 06.15)"],
  "2034-07-30": ["🎂 시모생신(음력 06.15)"], "2035-07-19": ["🎂 시모생신(음력 06.15)"],

  "2025-08-25": ["🎂 장모생신(음력 07.12)"], "2026-08-24": ["🎂 장모생신(음력 07.12)"], "2027-08-14": ["🎂 장모생신(음력 07.12)"],
  "2028-08-31": ["🎂 장모생신(음력 07.12)"], "2029-08-21": ["🎂 장모생신(음력 07.12)"], "2030-08-10": ["🎂 장모생신(음력 07.12)"],
  "2031-08-29": ["🎂 장모생신(음력 07.12)"], "2032-08-18": ["🎂 장모생신(음력 07.12)"], "2033-08-07": ["🎂 장모생신(음력 07.12)"],
  "2034-08-26": ["🎂 장모생신(음력 07.12)"], "2035-08-15": ["🎂 장모생신(음력 07.12)"],

  "2025-03-29": ["🎂 장인생신(음력 03.01)"], "2026-04-17": ["🎂 장인생신(음력 03.01)"], "2027-04-07": ["🎂 장인생신(음력 03.01)"],
  "2028-03-26": ["🎂 장인생신(음력 03.01)"], "2029-04-14": ["🎂 장인생신(음력 03.01)"], "2030-04-03": ["🎂 장인생신(음력 03.01)"],
  "2031-04-22": ["🎂 장인생신(음력 03.01)"], "2032-04-10": ["🎂 장인생신(음력 03.01)"], "2033-03-31": ["🎂 장인생신(음력 03.01)"],
  "2034-04-19": ["🎂 장인생신(음력 03.01)"], "2035-04-08": ["🎂 장인생신(음력 03.01)"],
};

export default function ScheduleList({ selectedRange, refreshKey, onRefresh }: Props) {
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);

  const getStandardDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getOldDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const dbData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ScheduleData, "id">),
      }));

      const [startDate, endDate] = selectedRange;
      const rangeDates: string[] = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        rangeDates.push(getStandardDateStr(current));
        rangeDates.push(getOldDateStr(current));
        current.setDate(current.getDate() + 1);
      }

      // 선택된 범위 내의 일정 필터링
      const filtered = dbData.filter((s) => rangeDates.includes(s.date));

      // 기념일 추가 로직 (선택된 범위 내의 모든 날짜에 대해)
      const currentAnniv = new Date(startDate);
      while (currentAnniv <= endDate) {
        const std = getStandardDateStr(currentAnniv);
        const mmDd = std.slice(5);

        if (SOLAR_ANNIVERSARIES[mmDd]) {
          filtered.push({
            id: `solar-${std}`,
            date: std,
            content: SOLAR_ANNIVERSARIES[mmDd]
          });
        }
        if (LUNAR_ANNIVERSARIES[std]) {
          LUNAR_ANNIVERSARIES[std].forEach((content, i) => {
            filtered.push({
              id: `lunar-${std}-${i}`,
              date: std,
              content
            });
          });
        }
        currentAnniv.setDate(currentAnniv.getDate() + 1);
      }

      setSchedules(filtered);
    });

    return () => unsubscribe();
  }, [selectedRange, refreshKey]);

  const handleBulkDelete = async () => {
    const [startDate, endDate] = selectedRange;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const isSameDay = s.toDateString() === e.toDateString();

    const dateInfo = isSameDay
      ? `${s.getMonth() + 1}월 ${s.getDate()}일`
      : `${s.getMonth() + 1}/${s.getDate()} ~ ${e.getMonth() + 1}/${e.getDate()}`;

    if (!confirm(`⚠️ ${dateInfo} 기간의 모든 일정을 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      const rangeDates: string[] = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        rangeDates.push(getStandardDateStr(current));
        rangeDates.push(getOldDateStr(current));
        current.setDate(current.getDate() + 1);
      }

      const schedulesRef = collection(db, "schedules");
      const q = query(schedulesRef, where("date", "in", rangeDates.slice(0, 10))); // query 'in' limit is 10

      // 'in' 쿼리는 최대 10개까지만 가능하므로, 안전하게 전체 데이터를 가져와서 필터링하거나 루프를 돕니다.
      // 여기서는 성능과 안정성을 위해 기존의 루프 방식을 유지하되 최적화합니다.
      const snapshot = await getDocs(schedulesRef);
      const toDelete = snapshot.docs.filter(doc => rangeDates.includes(doc.data().date));

      const deletePromises = toDelete.map(d => deleteDoc(doc(db, "schedules", d.id)));
      await Promise.all(deletePromises);

      // 알림 전송 (비동기)
      const userId = localStorage.getItem("userId");
      axios.post("/api/notify", {
        title: "🗑️ 일정 일괄 삭제",
        body: `${userId || "가족"}님이 ${dateInfo} 기간의 일정을 삭제했습니다.`,
      }).catch(console.error);

      alert("✅ 삭제가 완료되었습니다.");
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("❌ 삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (schedules.length === 0) return null;

  const [startDate, endDate] = selectedRange;
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  const headerText = isSameDay
    ? `${getStandardDateStr(startDate)}`
    : `${getStandardDateStr(startDate)} ~ ${getStandardDateStr(endDate)}`;

  return (
    <div className="mt-4 w-full max-w-md text-sm relative text-white">
      <h3 className="font-semibold mb-2 px-1">📌 {headerText} 일정 목록</h3>
      <ul className="space-y-2 mb-4">
        {schedules.map((item) => (
          <li key={item.id} className="flex justify-between items-center bg-[#3a312a] p-3 rounded-xl shadow-sm border border-brownBorder/30">
            <span className={`truncate font-bold ${
              item.id.startsWith("lunar-")
                ? "text-[#FFC90E]"
                : item.id.startsWith("solar-")
                ? "text-blue-400"
                : item.content.includes("(bak)")
                ? "text-black"
                : item.content.includes("(yong)")
                ? "text-red-400"
                : "text-white"
            }`}>
              {item.content}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleBulkDelete}
        disabled={loading}
        className={`w-full font-bold py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-md ${
          loading ? "bg-gray-500 cursor-not-allowed" : "bg-red-700/90 hover:bg-red-600 text-white"
        }`}
      >
        {loading ? "삭제 중..." : "일정 삭제"}
      </button>
    </div>
  );
}
