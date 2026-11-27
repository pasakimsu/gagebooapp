"use client";

import { useEffect, useState } from "react";
import {
  FirefighterRank,
  BASE_ANCHOR_SALARY_2026,
  getBaseSalaryByStep,
} from "@/lib/salaryData";
import {
  calculateMonthlySalary,
  LeaveCounts,
  ExtraDutyCounts,
  ScheduleItem,
} from "@/lib/salaryCalculator";

interface Props {
  currentDate: Date; // 캘린더에서 현재 선택/표시 중인 년/월
  dutyStartDate: Date;
  schedules: ScheduleItem[];
}

const numberToKorean = (num: number): string => {
  if (num <= 0) return "0원";
  const units = ["", "만", "억", "조"];
  let result = "";
  let unitIndex = 0;
  let tempNum = num;
  while (tempNum > 0) {
    const part = tempNum % 10000;
    if (part > 0) result = `${part.toLocaleString()}${units[unitIndex]} ` + result;
    tempNum = Math.floor(tempNum / 10000);
    unitIndex++;
  }
  return result.trim() + "원";
};

export default function SalaryEstimateBadge({
  currentDate,
  dutyStartDate,
  schedules,
}: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 계급 & 호봉 설정 (기본값: 소방교 11호봉 - 실제 보수명세서 연동)
  const [rank, setRank] = useState<FirefighterRank>("소방교");
  const [step, setStep] = useState<number>(11);
  const [customBaseSalary, setCustomBaseSalary] = useState<string>("");

  // 기타 고정 수당 합계 (직급보조비, 정액급식비, 위험수당, 대우수당, 출동가산금, 가족수당 등)
  // 기본값: 약 870,490원 (실제 명세서 기반)
  const [fixedAllowance, setFixedAllowance] = useState<string>("870,490");

  const [showAdjust, setShowAdjust] = useState(false);

  // 수동 수치 조절
  const [manualLeaves, setManualLeaves] = useState<LeaveCounts | null>(null);
  const [manualExtra, setManualExtra] = useState<ExtraDutyCounts | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("userId");
      setUserId(storedUser);

      const storedRank = localStorage.getItem("firefighterRank") as FirefighterRank;
      if (storedRank && BASE_ANCHOR_SALARY_2026[storedRank]) {
        setRank(storedRank);
      }

      const storedStep = localStorage.getItem("firefighterStep");
      if (storedStep && !isNaN(Number(storedStep))) {
        setStep(Number(storedStep));
      } else {
        setStep(11); // 소방교 11호봉 기본값
      }

      const storedCustomSalary = localStorage.getItem("firefighterCustomSalary");
      if (storedCustomSalary) {
        setCustomBaseSalary(storedCustomSalary);
      }

      const storedFixed = localStorage.getItem("firefighterFixedAllowance");
      if (storedFixed !== null) {
        setFixedAllowance(storedFixed);
      }
    }
  }, []);

  const handleRankChange = (newRank: FirefighterRank) => {
    setRank(newRank);
    if (typeof window !== "undefined") {
      localStorage.setItem("firefighterRank", newRank);
    }
  };

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    if (typeof window !== "undefined") {
      localStorage.setItem("firefighterStep", String(newStep));
    }
  };

  const handleCustomSalaryChange = (val: string) => {
    const numeric = val.replace(/[^\d]/g, "");
    setCustomBaseSalary(numeric ? Number(numeric).toLocaleString() : "");
    if (typeof window !== "undefined") {
      localStorage.setItem("firefighterCustomSalary", numeric);
    }
  };

  const handleFixedAllowanceChange = (val: string) => {
    const numeric = val.replace(/[^\d]/g, "");
    setFixedAllowance(numeric ? Number(numeric).toLocaleString() : "");
    if (typeof window !== "undefined") {
      localStorage.setItem("firefighterFixedAllowance", numeric ? Number(numeric).toLocaleString() : "");
    }
  };

  // bak 또는 admin 계정만 노출
  if (userId !== "bak" && userId !== "admin") {
    return null;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const parsedCustomSalary = customBaseSalary ? Number(customBaseSalary.replace(/,/g, "")) : undefined;
  const parsedFixedAllowance = fixedAllowance ? Number(fixedAllowance.replace(/,/g, "")) : 0;

  const result = calculateMonthlySalary({
    year,
    month,
    dutyStartDate,
    rank,
    step,
    customBaseSalary: parsedCustomSalary,
    schedules,
    manualLeaveCounts: manualLeaves || undefined,
    manualExtraDutyCounts: manualExtra || undefined,
  });

  const grossTotalSalary = result.estimatedTotalSalary + parsedFixedAllowance;

  const ranksList: FirefighterRank[] = ["소방령", "소방경", "소방위", "소방장", "소방교", "소방사"];
  const stepsList = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="relative inline-block text-left">
      {/* 1. 우측 상단 컴팩트 라벨 배지 */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3a312a] hover:bg-[#4a3f37] border border-[#FFC90E]/40 text-[#FFC90E] rounded-full text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
        title="bak님 실제 보수명세서 연동 예상 월급 보기"
      >
        <span className="text-[10px] bg-[#FFC90E]/20 text-[#FFC90E] px-1.5 py-0.5 rounded-md font-extrabold">
          🔒 bak
        </span>
        <span>💰 {month}월 예상 {Math.floor(grossTotalSalary / 10000).toLocaleString()}만원</span>
        <span className="text-[10px] text-gray-400">▼</span>
      </button>

      {/* 2. 클릭 시 열리는 상세 수당 명세서 팝업 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[#2f2a25] border border-brownBorder/50 rounded-2xl w-full max-w-lg shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]">

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#3a312a] border-b border-brownBorder/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#FFC90E]">
                    {year}년 {month}월 예상 보수 명세서
                  </h3>
                  <p className="text-[10px] text-gray-400">실제 보수지급명세서 기준 (소방교 11호봉 등)</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-700/50 hover:bg-gray-600 text-gray-300 font-bold flex items-center justify-center text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 모달 본문 (스크롤) */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs sm:text-sm">

              {/* 계급 & 호봉 선택 영역 */}
              <div className="bg-[#383028] p-3.5 rounded-xl border border-brownBorder/30 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">계급 선택</label>
                    <select
                      value={rank}
                      onChange={(e) => handleRankChange(e.target.value as FirefighterRank)}
                      className="w-full bg-gray-800 text-amber-300 font-bold px-2.5 py-1.5 rounded-lg border border-brownBorder outline-none text-xs"
                    >
                      {ranksList.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">호봉 선택 (1~31호봉)</label>
                    <select
                      value={step}
                      onChange={(e) => handleStepChange(Number(e.target.value))}
                      className="w-full bg-gray-800 text-amber-300 font-bold px-2.5 py-1.5 rounded-lg border border-brownBorder outline-none text-xs"
                    >
                      {stepsList.map((s) => (
                        <option key={s} value={s}>
                          {s}호봉 ({getBaseSalaryByStep(rank, s).toLocaleString()}원)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 기본급 및 기타 수당 설정 */}
                <div className="pt-2 border-t border-brownBorder/20 space-y-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-gray-400">봉급(기본급) 수동 수정</label>
                      {customBaseSalary && (
                        <button
                          onClick={() => handleCustomSalaryChange("")}
                          className="text-[10px] text-rose-300 hover:underline"
                        >
                          호봉 기본값으로 초기화
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={`기본 호봉가: ${getBaseSalaryByStep(rank, step).toLocaleString()}원`}
                      value={customBaseSalary}
                      onChange={(e) => handleCustomSalaryChange(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg bg-gray-900 text-white border border-brownBorder/50 text-xs outline-none focus:ring-1 focus:ring-amber-400 placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      기타 고정 수당 합계 (직급보조비, 정액급식비, 위험/대우/출동가산금 등)
                    </label>
                    <input
                      type="text"
                      placeholder="870,490"
                      value={fixedAllowance}
                      onChange={(e) => handleFixedAllowanceChange(e.target.value)}
                      className="w-full p-2 rounded-lg bg-gray-900 text-white border border-brownBorder/50 text-xs outline-none focus:ring-1 focus:ring-amber-400 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* 달력 자동 집계 현황 */}
              <div className="bg-[#383028]/60 p-3.5 rounded-xl border border-brownBorder/20 space-y-1.5">
                <p className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                  <span>📅</span> {year}년 {month}월 달력 자동 감지 현황
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 pt-1">
                  <div className="bg-gray-800/40 p-2 rounded-lg">
                    <p className="text-gray-400">총 당번 근무</p>
                    <p className="font-extrabold text-white text-xs mt-0.5">
                      {result.totalDutyCount}회 <span className="text-[10px] text-gray-400 font-normal">(평일 {result.weekdayDutyCount} / 휴일 {result.holidayDutyCount})</span>
                    </p>
                  </div>
                  <div className="bg-gray-800/40 p-2 rounded-lg">
                    <p className="text-gray-400">감지된 연가/대기</p>
                    <p className="font-bold text-white text-[10px] mt-0.5 truncate">
                      연가: {result.leaveCounts.당번연가 + result.leaveCounts.야간연가 + result.leaveCounts.주간연가}건 | 대기: {result.extraDutyCounts.당번대기 + result.extraDutyCounts.야간대기 + result.extraDutyCounts.주간대기}건
                    </p>
                  </div>
                </div>
              </div>

              {/* 세부 수당 계산 내역 */}
              <div className="bg-[#3a312a] p-4 rounded-xl border border-brownBorder/30 space-y-2.5">
                <p className="font-bold text-gray-300 text-xs border-b border-brownBorder/20 pb-2">
                  📊 {rank} {step}호봉 보수 세부 명세서 (세전)
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-200">
                    <span>💵 봉급 (기본급)</span>
                    <span className="font-bold">{result.baseSalary.toLocaleString()}원</span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-300">
                    <span>➕ 당번 초과근무 수당 ({result.totalDutyCount}회)</span>
                    <span className="font-bold">+{result.totalDutyPay.toLocaleString()}원</span>
                  </div>
                  <div className="pl-3 text-[10px] text-gray-400 space-y-0.5 border-l-2 border-emerald-500/30">
                    <div className="flex justify-between">
                      <span>• 시간외 단가: {result.hourlyOvertime.toLocaleString()}원 / 야간: {result.hourlyNight.toLocaleString()}원</span>
                      <span>평일 {result.weekdayDutyCount}회 / 휴일 {result.holidayDutyCount}회</span>
                    </div>
                  </div>

                  {result.extraDutyPayTotal > 0 && (
                    <div className="flex justify-between items-center text-blue-300">
                      <span>➕ 대기/희망근무 수당</span>
                      <span className="font-bold">+{result.extraDutyPayTotal.toLocaleString()}원</span>
                    </div>
                  )}

                  {result.leaveDeductionTotal > 0 && (
                    <div className="flex justify-between items-center text-rose-300">
                      <span>➖ 연가 차감액</span>
                      <span className="font-bold">-{result.leaveDeductionTotal.toLocaleString()}원</span>
                    </div>
                  )}

                  {parsedFixedAllowance > 0 && (
                    <div className="flex justify-between items-center text-amber-300 pt-1 border-t border-white/5">
                      <span>➕ 기타 고정 수당 합계 (직급보조비/급식비/위험수당 등)</span>
                      <span className="font-bold">+{parsedFixedAllowance.toLocaleString()}원</span>
                    </div>
                  )}
                </div>

                {/* 최종 합계 */}
                <div className="pt-3 border-t border-brownBorder/40 flex flex-col items-end gap-1">
                  <p className="text-[11px] text-gray-400 font-medium">{year}년 {month}월 예상 보수 총계 (세전)</p>
                  <p className="text-lg sm:text-xl font-black text-[#FFC90E]">
                    {grossTotalSalary.toLocaleString()}원
                  </p>
                  <p className="text-[10px] text-amber-200/80 font-bold">
                    ({numberToKorean(grossTotalSalary)})
                  </p>
                </div>
              </div>

              {/* 연가/대기 수동 조절 어코디언 */}
              <div className="border border-brownBorder/20 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowAdjust(!showAdjust)}
                  className="w-full p-2.5 bg-[#383028] hover:bg-[#423930] text-gray-300 font-bold text-xs flex justify-between items-center transition cursor-pointer"
                >
                  <span>⚙️ 연가 및 대기근무 횟수 수동 조절</span>
                  <span>{showAdjust ? "▲ 접기" : "▼ 펼치기"}</span>
                </button>

                {showAdjust && (
                  <div className="p-3 bg-gray-900/40 space-y-3 text-[11px]">
                    <div>
                      <p className="font-bold text-rose-300 mb-1.5">➖ 연가 차감 횟수</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {(["당번연가", "야간연가", "주간연가"] as const).map((k) => (
                          <div key={k} className="bg-gray-800 p-2 rounded-lg border border-brownBorder/20">
                            <p className="text-gray-400 text-[10px]">{k}</p>
                            <div className="flex justify-center items-center gap-2 mt-1">
                              <button
                                onClick={() =>
                                  setManualLeaves((prev) => {
                                    const curr = prev || { ...result.leaveCounts };
                                    return { ...curr, [k]: Math.max(0, curr[k] - 1) };
                                  })
                                }
                                className="w-5 h-5 bg-gray-700 text-white rounded font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-bold text-white">
                                {(manualLeaves || result.leaveCounts)[k]}
                              </span>
                              <button
                                onClick={() =>
                                  setManualLeaves((prev) => {
                                    const curr = prev || { ...result.leaveCounts };
                                    return { ...curr, [k]: curr[k] + 1 };
                                  })
                                }
                                className="w-5 h-5 bg-gray-700 text-white rounded font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-blue-300 mb-1.5">➕ 대기근무 횟수</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {(["당번대기", "야간대기", "주간대기"] as const).map((k) => (
                          <div key={k} className="bg-gray-800 p-2 rounded-lg border border-brownBorder/20">
                            <p className="text-gray-400 text-[10px]">{k}</p>
                            <div className="flex justify-center items-center gap-2 mt-1">
                              <button
                                onClick={() =>
                                  setManualExtra((prev) => {
                                    const curr = prev || { ...result.extraDutyCounts };
                                    return { ...curr, [k]: Math.max(0, curr[k] - 1) };
                                  })
                                }
                                className="w-5 h-5 bg-gray-700 text-white rounded font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-bold text-white">
                                {(manualExtra || result.extraDutyCounts)[k]}
                              </span>
                              <button
                                onClick={() =>
                                  setManualExtra((prev) => {
                                    const curr = prev || { ...result.extraDutyCounts };
                                    return { ...curr, [k]: curr[k] + 1 };
                                  })
                                }
                                className="w-5 h-5 bg-gray-700 text-white rounded font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(manualLeaves || manualExtra) && (
                      <button
                        onClick={() => {
                          setManualLeaves(null);
                          setManualExtra(null);
                        }}
                        className="w-full py-1.5 bg-gray-700 text-gray-200 rounded font-bold text-[10px] hover:bg-gray-600 transition cursor-pointer"
                      >
                        🔄 자동 감지값으로 초기화
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* 모달 푸터 */}
            <div className="p-3 bg-[#3a312a] border-t border-brownBorder/30 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow transition active:scale-95 cursor-pointer"
              >
                확인 및 닫기
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
