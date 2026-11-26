"use client";

import { useEffect, useState } from "react";
import CalendarView from "./components/CalendarView";
import ScheduleInput from "./components/ScheduleInput";
import ScheduleList from "./components/ScheduleList";
import SalaryEstimateBadge from "./components/SalaryEstimateBadge";
import AuthGuard from "@/components/AuthGuard";
import NotificationPermission from "@/components/NotificationPermission";
import { db, doc, getDoc, onSnapshot, setDoc, collection } from "@/lib/firebase";
import { ScheduleItem } from "@/lib/salaryCalculator";

export default function SchedulePage() {
  const [selectedRange, setSelectedRange] = useState<[Date, Date]>([
    new Date(),
    new Date(),
  ]);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [dutyStartDate, setDutyStartDate] = useState<Date | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (stored) setUserId(stored);

    const dutyDocRef = doc(db, "settings", "dutyConfig");

    const initOrSubscribe = async () => {
      const snapshot = await getDoc(dutyDocRef);
      if (!snapshot.exists()) {
        const defaultDate = new Date("2025-03-01");
        await setDoc(dutyDocRef, {
          dutyStartDate: defaultDate.toISOString(),
        });
      }

      onSnapshot(dutyDocRef, (snap) => {
        const data = snap.data();
        if (data?.dutyStartDate) {
          const parsed = new Date(data.dutyStartDate);
          if (!isNaN(parsed.getTime())) {
            setDutyStartDate(parsed);
            setTempStartDate(parsed);
          }
        }
      });
    };

    initOrSubscribe();

    // 실시간 일정 수신 (월급 수당 계산용)
    const unsubSchedules = onSnapshot(collection(db, "schedules"), (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ScheduleItem, "id">),
      }));
      setSchedules(data);
    });

    return () => unsubSchedules();
  }, []);

  const handleConfirmDutyDate = async () => {
    if (!tempStartDate || isNaN(tempStartDate.getTime())) {
      alert("❌ 올바른 날짜를 선택하세요.");
      return;
    }

    try {
      await setDoc(doc(db, "settings", "dutyConfig"), {
        dutyStartDate: tempStartDate.toISOString(),
      });

      alert("✅ 기준일자가 저장되었습니다!");
    } catch (err) {
      console.error("❌ Firestore 저장 오류:", err);
      alert("❌ 저장 중 오류가 발생했습니다.");
    }
  };

  if (!dutyStartDate || isNaN(dutyStartDate.getTime())) {
    return (
      <div className="text-white text-center mt-10">
        📡 기준일자를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="flex flex-col items-center min-h-screen justify-start bg-[#2f2a25] text-white p-4 sm:p-6">

        {/* 상단 타이틀 & bak 전용 예상 월급 라벨 배지 */}
        <div className="flex items-center justify-between w-full max-w-md mb-4 px-1">
          <h2 className="text-xl sm:text-2xl font-bold">📅 일정 공유 캘린더</h2>
          <SalaryEstimateBadge
            currentDate={currentViewDate}
            dutyStartDate={dutyStartDate}
            schedules={schedules}
          />
        </div>

        <NotificationPermission />

        {userId === "bak" && (
          <div className="mb-6 w-full max-w-md">
            <label className="block mb-1 text-sm font-semibold">📅 당번 기준일자</label>
            <input
              type="date"
              value={
                tempStartDate && !isNaN(tempStartDate.getTime())
                  ? tempStartDate.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (!isNaN(newDate.getTime())) {
                  setTempStartDate(newDate);
                }
              }}
              className="w-full p-2 mb-2 rounded bg-gray-700 text-white text-sm"
            />
            <button
              onClick={handleConfirmDutyDate}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded text-sm transition duration-300"
            >
              ✅ 기준일자 확정
            </button>
          </div>
        )}

        <CalendarView
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
          refreshKey={refreshKey}
          dutyStartDate={dutyStartDate}
          onActiveMonthChange={(date) => setCurrentViewDate(date)}
        />

        <ScheduleInput
          selectedRange={selectedRange}
          onRegister={handleRefresh}
        />

        <ScheduleList
          selectedRange={selectedRange}
          refreshKey={refreshKey}
          onRefresh={handleRefresh}
        />
      </div>
    </AuthGuard>
  );
}
