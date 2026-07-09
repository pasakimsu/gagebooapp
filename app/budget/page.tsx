"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppStyleButton from "@/components/AppStyleButton";
import { db, collection, onSnapshot } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";

interface ScheduleItem {
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

export default function BudgetHomePage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [monthlySchedules, setMonthlySchedules] = useState<ScheduleItem[]>([]);
  const [weeklySchedules, setWeeklySchedules] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) setUserId(storedUserId);
  }, []);

  const toISODate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const getKoreanDay = (date: Date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[date.getDay()];
  };

  const formatRangeContent = (items: ScheduleItem[]) => {
    if (items.length === 0) return null;
    const content = items[0].content;
    const dates = items.map((item) => toISODate(item.date)).sort((a, b) => a.getTime() - b.getTime());
    const start = dates[0];
    const end = dates[dates.length - 1];
    const formatDate = (date: Date) => `${date.getMonth() + 1}.${date.getDate()}(${getKoreanDay(date)})`;
    return dates.length === 1 ? `${formatDate(start)} ${content}` : `${formatDate(start)} ~ ${formatDate(end)} ${content}`;
  };

  const groupSchedulesByContent = (schedules: ScheduleItem[]) => {
    const grouped: Record<string, ScheduleItem[]> = {};
    for (const item of schedules) {
      if (!grouped[item.content]) grouped[item.content] = [];
      grouped[item.content].push(item);
    }
    return Object.values(grouped);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      const dbSchedules = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ScheduleItem, "id">),
      }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const autoAnniversaries: ScheduleItem[] = [];
      for (let m = 1; m <= 12; m++) {
        const daysInM = new Date(currentYear, m, 0).getDate();
        for (let d = 1; d <= daysInM; d++) {
          const dateStr = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const mmDd = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (SOLAR_ANNIVERSARIES[mmDd]) {
            autoAnniversaries.push({ id: `solar-${dateStr}`, date: dateStr, content: SOLAR_ANNIVERSARIES[mmDd] });
          }
          if (LUNAR_ANNIVERSARIES[dateStr]) {
            LUNAR_ANNIVERSARIES[dateStr].forEach((content, i) => {
              autoAnniversaries.push({ id: `lunar-${dateStr}-${i}`, date: dateStr, content });
            });
          }
        }
      }

      const all = [...dbSchedules, ...autoAnniversaries];

      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay());
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);

      const filteredMonth = all.filter((item) => {
        const [y, m] = item.date.split("-");
        return Number(y) === currentYear && Number(m) === currentMonth;
      }).sort((a, b) => toISODate(a.date).getTime() - toISODate(b.date).getTime());

      const filteredWeek = all.filter((item) => {
        const date = toISODate(item.date);
        return date >= currentWeekStart && date <= currentWeekEnd;
      }).sort((a, b) => toISODate(a.date).getTime() - toISODate(b.date).getTime());

      setMonthlySchedules(filteredMonth);
      setWeeklySchedules(filteredWeek);
    });
    return () => unsubscribe();
  }, []);

  const getDaysSinceReference = (referenceDateStr: string) => {
    const referenceDate = new Date(referenceDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - referenceDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getMonthsSinceReference = (referenceDateStr: string) => {
    const start = new Date(referenceDateStr);
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months--;
    return months;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center bg-beigeDark px-4 transition-colors">
        <div className="bg-[#2f2a25] p-8 rounded-xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{userId}님 로그인했습니다 🎉</h2>
          <div className="bg-[#3e352c] text-white p-4 rounded-md my-6 text-sm leading-relaxed shadow-inner text-left">
            <p className="mb-2 font-bold text-lg border-b border-brownBorder pb-1">서한이-{getDaysSinceReference("2025-01-13")}일째 ({getMonthsSinceReference("2025-01-13")}개월)</p>
            {weeklySchedules.length > 0 && (
              <>
                <p className="mt-4 font-semibold text-gray-400">이번주 일정</p>
                <ul className="list-disc list-inside space-y-1">
                  {groupSchedulesByContent(weeklySchedules).map((group, idx) => {
                    const isSpecial = group[0].id.startsWith("lunar-") || group[0].id.startsWith("solar-");
                    return <li key={idx} className={`font-bold ${isSpecial ? "text-[#FFC90E]" : "text-white"}`}>{formatRangeContent(group)}</li>;
                  })}
                </ul>
              </>
            )}
            {monthlySchedules.length > 0 && (
              <>
                <p className="mt-4 font-semibold text-gray-400">이번달 일정</p>
                <ul className="list-disc list-inside space-y-1">
                  {groupSchedulesByContent(monthlySchedules).map((group, idx) => {
                    const isSpecial = group[0].id.startsWith("lunar-") || group[0].id.startsWith("solar-");
                    return <li key={idx} className={isSpecial ? "text-[#FFC90E] font-bold" : "text-white"}>{formatRangeContent(group)}</li>;
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="flex justify-center gap-6">
            <AppStyleButton icon="📅" label="일정" onClick={() => router.push("/schedule")} />
            <AppStyleButton icon="💰" label="계산기" onClick={() => router.push("/calcul")} />
            <AppStyleButton icon="📁" label="부조금" onClick={() => router.push("/Donations")} />
            <AppStyleButton icon="🏦" label="대출" onClick={() => router.push("/loan")} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
