"use client";

import { useEffect, useState } from "react";
import { db, collection, onSnapshot, deleteDoc, doc } from "@/lib/firebase";

interface Props {
  selectedDate: Date;
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

export default function ScheduleList({ selectedDate, refreshKey, onRefresh }: Props) {
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const getOldDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}-${m}-${d}`;
  };

  const getStandardDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const oldDateStr = getOldDateStr(selectedDate);
  const stdDateStr = getStandardDateStr(selectedDate);
  const mmDd = stdDateStr.slice(5);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const dbData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ScheduleData, "id">),
      }));

      const filtered = dbData.filter((s) => s.date === oldDateStr || s.date === stdDateStr);

      // 1. 양력 기념일 추가 (파란색)
      if (SOLAR_ANNIVERSARIES[mmDd]) {
        filtered.push({
          id: `solar-${stdDateStr}`,
          date: stdDateStr,
          content: SOLAR_ANNIVERSARIES[mmDd]
        });
      }

      // 2. 음력 기념일 추가 (노란색)
      if (LUNAR_ANNIVERSARIES[stdDateStr]) {
        LUNAR_ANNIVERSARIES[stdDateStr].forEach((content, i) => {
          filtered.push({
            id: `lunar-${stdDateStr}-${i}`,
            date: stdDateStr,
            content
          });
        });
      }

      setSchedules(filtered);
    });

    return () => unsubscribe();
  }, [selectedDate, refreshKey]);

  const handleDelete = async () => {
    if (!toDeleteId) return;
    if (toDeleteId.startsWith("lunar-") || toDeleteId.startsWith("solar-")) {
      alert("⚠️ 자동 등록된 기념일은 삭제할 수 없습니다.");
      setShowConfirm(false); setToDeleteId(null);
      return;
    }
    try {
      await deleteDoc(doc(db, "schedules", toDeleteId));
      onRefresh(); setShowConfirm(false); setToDeleteId(null);
    } catch (error) {
      console.error(error);
      alert("❌ 삭제 중 오류가 발생했습니다.");
    }
  };

  if (schedules.length === 0) return null;

  return (
    <div className="mt-4 w-full max-w-md text-sm relative text-white">
      <h3 className="font-semibold mb-2 px-1">📌 {stdDateStr} 일정 목록</h3>
      <ul className="space-y-2">
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
            {!item.id.startsWith("lunar-") && !item.id.startsWith("solar-") && (
              <button onClick={() => { setToDeleteId(item.id); setShowConfirm(true); }} className="bg-red-600/80 hover:bg-red-700 text-white text-[10px] px-3 py-1.5 rounded-lg transition shadow-sm font-bold">삭제</button>
            )}
          </li>
        ))}
      </ul>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#2f2a25] text-white p-6 rounded-2xl shadow-2xl text-center w-72 border border-brownBorder">
            <p className="mb-6 font-bold">정말 삭제하시겠습니까?</p>
            <div className="flex justify-center gap-3">
              <button onClick={handleDelete} className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-700 shadow-md">삭제</button>
              <button onClick={() => { setShowConfirm(false); setToDeleteId(null); }} className="bg-gray-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-gray-500 shadow-md">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
