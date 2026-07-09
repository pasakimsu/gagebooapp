"use client";

import { useEffect, useState } from "react";
import CalendarView from "./components/CalendarView";
import ScheduleInput from "./components/ScheduleInput";
import ScheduleList from "./components/ScheduleList";
import AuthGuard from "@/components/AuthGuard";
import { db, doc, getDoc, onSnapshot, setDoc } from "@/lib/firebase";

export default function SchedulePage() {
  const [selectedRange, setSelectedRange] = useState<[Date, Date]>([
    new Date(),
    new Date(),
  ]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dutyStartDate, setDutyStartDate] = useState<Date | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
      <div className="flex flex-col items-center min-h-screen justify-center bg-[#2f2a25] text-white p-6">
        <h2 className="text-2xl font-bold mb-4">📅 일정 공유 캘린더</h2>

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
              className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
            />
            <button
              onClick={handleConfirmDutyDate}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition duration-300"
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
        />

        <ScheduleInput
          selectedRange={selectedRange}
          onRegister={handleRefresh}
        />

        <ScheduleList
          selectedDate={selectedRange[0]} // 시작 날짜 기준
          refreshKey={refreshKey}
          onRefresh={handleRefresh}
        />
      </div>
    </AuthGuard>
  );
}
