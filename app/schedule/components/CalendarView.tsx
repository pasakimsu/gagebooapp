"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./calendarStyle.css";
import { db, collection, getDocs } from "@/lib/firebase";

interface Props {
  selectedRange: [Date, Date];
  onRangeChange: (range: [Date, Date]) => void;
  refreshKey: number;
  dutyStartDate: Date;
}

interface ScheduleData {
  id: string;
  date: string;
  content: string;
}

// 매해 반복되는 양력 기념일 (MM-DD)
const SOLAR_ANNIVERSARIES: Record<string, string> = {
  "12-06": "🎂 재현생일",
  "10-26": "🎂 용휘생일",
  "01-13": "🎂 서한생일",
  "07-06": "💍 결혼기념일",
};

// 음력 기념일 -> 양력 변환 데이터 (2025 ~ 2035)
const LUNAR_ANNIVERSARIES: Record<string, string[]> = {
  // 시부생신 (음력 10.07)
  "2025-11-26": ["🎂 시부생신(음력 10.07)"], "2026-11-15": ["🎂 시부생신(음력 10.07)"], "2027-11-04": ["🎂 시부생신(음력 10.07)"],
  "2028-11-22": ["🎂 시부생신(음력 10.07)"], "2029-11-12": ["🎂 시부생신(음력 10.07)"], "2030-11-02": ["🎂 시부생신(음력 10.07)"],
  "2031-11-20": ["🎂 시부생신(음력 10.07)"], "2032-11-09": ["🎂 시부생신(음력 10.07)"], "2033-11-28": ["🎂 시부생신(음력 10.07)"],
  "2034-11-17": ["🎂 시부생신(음력 10.07)"], "2035-11-06": ["🎂 시부생신(음력 10.07)"],

  // 시모생신 (음력 06.15)
  "2025-07-09": ["🎂 시모생신(음력 06.15)"], "2026-07-28": ["🎂 시모생신(음력 06.15)"], "2027-07-18": ["🎂 시모생신(음력 06.15)"],
  "2028-08-05": ["🎂 시모생신(음력 06.15)"], "2029-07-26": ["🎂 시모생신(음력 06.15)"], "2030-07-15": ["🎂 시모생신(음력 06.15)"],
  "2031-08-02": ["🎂 시모생신(음력 06.15)"], "2032-07-22": ["🎂 시모생신(음력 06.15)"], "2033-07-11": ["🎂 시모생신(음력 06.15)"],
  "2034-07-30": ["🎂 시모생신(음력 06.15)"], "2035-07-19": ["🎂 시모생신(음력 06.15)"],

  // 장모생신 (음력 07.12)
  "2025-08-25": ["🎂 장모생신(음력 07.12)"], "2026-08-24": ["🎂 장모생신(음력 07.12)"], "2027-08-14": ["🎂 장모생신(음력 07.12)"],
  "2028-08-31": ["🎂 장모생신(음력 07.12)"], "2029-08-21": ["🎂 장모생신(음력 07.12)"], "2030-08-10": ["🎂 장모생신(음력 07.12)"],
  "2031-08-29": ["🎂 장모생신(음력 07.12)"], "2032-08-18": ["🎂 장모생신(음력 07.12)"], "2033-08-07": ["🎂 장모생신(음력 07.12)"],
  "2034-08-26": ["🎂 장모생신(음력 07.12)"], "2035-08-15": ["🎂 장모생신(음력 07.12)"],

  // 장인생신 (음력 03.01)
  "2025-03-29": ["🎂 장인생신(음력 03.01)"], "2026-04-17": ["🎂 장인생신(음력 03.01)"], "2027-04-07": ["🎂 장인생신(음력 03.01)"],
  "2028-03-26": ["🎂 장인생신(음력 03.01)"], "2029-04-14": ["🎂 장인생신(음력 03.01)"], "2030-04-03": ["🎂 장인생신(음력 03.01)"],
  "2031-04-22": ["🎂 장인생신(음력 03.01)"], "2032-04-10": ["🎂 장인생신(음력 03.01)"], "2033-03-31": ["🎂 장인생신(음력 03.01)"],
  "2034-04-19": ["🎂 장인생신(음력 03.01)"], "2035-04-08": ["🎂 장인생신(음력 03.01)"],
};

export default function CalendarView({
  selectedRange,
  onRangeChange,
  refreshKey,
  dutyStartDate,
}: Props) {
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);

  // 구형 포맷 (2025-3-21)
  const getOldDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}-${m}-${d}`;
  };

  // 표준 포맷 (2025-03-21)
  const getStandardDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDutyLabel = (date: Date): "당번" | "비번" => {
    const start = new Date(dutyStartDate);
    const target = new Date(date);
    start.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const index = (diff % 3 + 3) % 3;
    return index === 0 ? "당번" : "비번";
  };

  const fetchSchedules = async () => {
    const snapshot = await getDocs(collection(db, "schedules"));
    const dbData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ScheduleData, "id">),
    }));
    setSchedules(dbData);
  };

  useEffect(() => {
    fetchSchedules();
  }, [refreshKey]);

  const tileClassName = ({ date }: { date: Date }) =>
    getDutyLabel(date) === "당번" ? "duty-tile" : "";

  const tileContent = ({ date }: { date: Date }) => {
    const oldDateStr = getOldDateStr(date);
    const stdDateStr = getStandardDateStr(date);
    const mmDd = stdDateStr.slice(5); // MM-DD

    // DB 일정 필터링
    const daySchedules = [...schedules.filter((s) => s.date === oldDateStr || s.date === stdDateStr)];

    // 1. 양력 기념일 추가 (파란색)
    if (SOLAR_ANNIVERSARIES[mmDd]) {
      daySchedules.push({ id: `solar-${stdDateStr}`, date: stdDateStr, content: SOLAR_ANNIVERSARIES[mmDd] });
    }

    // 2. 음력 기념일 추가 (노란색)
    if (LUNAR_ANNIVERSARIES[stdDateStr]) {
      LUNAR_ANNIVERSARIES[stdDateStr].forEach((content, i) => {
        daySchedules.push({ id: `lunar-${stdDateStr}-${i}`, date: stdDateStr, content });
      });
    }

    return (
      <div className="mt-4 text-center text-[8px] sm:text-[10px] px-0.5 sm:px-1">
        {daySchedules.slice(0, 2).map((s, i) => (
          <p
            key={i}
            className={`leading-tight whitespace-normal truncate font-bold mb-0.5 ${
              s.id.startsWith("lunar-")
                ? "text-[#FFC90E]"
                : s.id.startsWith("solar-")
                ? "text-blue-500"
                : s.content.includes("(bak)")
                ? "text-black"
                : s.content.includes("(yong)")
                ? "text-red-500"
                : "text-blue-500"
            }`}
          >
            {s.content}
          </p>
        ))}
        {daySchedules.length > 2 && (
          <p className="text-gray-400 text-[8px]">+{daySchedules.length - 2}</p>
        )}
      </div>
    );
  };

  const handleChange = (value: Date | [Date | null, Date | null] | null) => {
    if (Array.isArray(value) && value[0] instanceof Date && value[1] instanceof Date) {
      onRangeChange([value[0], value[1]]);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 text-black shadow-md w-full max-w-[430px]">
      <Calendar
        onChange={handleChange}
        value={selectedRange}
        selectRange={true}
        calendarType="gregory"
        locale="ko-KR"
        tileClassName={tileClassName}
        tileContent={tileContent}
      />
    </div>
  );
}
