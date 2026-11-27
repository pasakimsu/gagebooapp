"use client";

import { useEffect, useState } from "react";
import {
  FirefighterRank,
  TaxRateOption,
  OFFICIAL_STEP_SALARY_2026,
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

  // 계급 & 호봉 설정 (기본값: 소방교 11호봉 - 법정 [별표 10] 3,012,000원)
  const [rank, setRank] = useState<FirefighterRank>("소방교");
  const [step, setStep] = useState<number>(11);
  const [customBaseSalary, setCustomBaseSalary] = useState<string>("");

  // 기타 고정 수당 합계 (기본값: 약 870,490원)
  const [fixedAllowance, setFixedAllowance] = useState<string>("870,490");

  // 원천징수 세율 선택 (80% / 100% / 120%)
  const [taxRateOption, setTaxRateOption] = useState<TaxRateOption>(80);

  // 기타 공제액 수동 조절 (기본값: 약 414,000원)
  const [manualOtherDeductionStr, setManualOtherDeductionStr] = useState<string>("414,000");

  const [showAdjust, setShowAdjust] = useState(false);

  // 수동 수치 조절 (연가 / 대기)
  const [manualLeaves, setManualLeaves] = useState<LeaveCounts | null>(null);
  const [manualExtra, setManualExtra] = useState<ExtraDutyCounts | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("userId");
      setUserId(storedUser);

      const storedRank = localStorage.getItem("firefighterRank") as FirefighterRank;
      if (storedRank && OFFICIAL_STEP_SALARY_2026[storedRank]) {
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

      const storedTax = localStorage.getItem("firefighterTaxRateOption");
      if (storedTax) {
        setTaxRateOption(Number(storedTax) as TaxRateOption);
      }

      const storedOtherDed = localStorage.getItem("firefighterOtherDeduction");
      if (storedOtherDed !== null) {
        setManualOtherDeductionStr(storedOtherDed);
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

  const handleTaxRateChange = (option: TaxRateOption) => {
    setTaxRateOption(option);
    if (typeof window !== "undefined") {
      localStorage.setItem("firefighterTaxRateOption", String(option));
    }
  };

  const handleOtherDeductionsChange = (val: string) => {
    const numeric = val.replace(/[^\d]/g, "");
    setManualOtherDeductionStr(numeric ? Number(numeric).toLocaleString() : "");
    if (typeof window !== "undefined") {
      localStorage.setItem("firefighterOtherDeduction", numeric ? Number(numeric).toLocaleString() : "");
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
  const parsedOtherDeductions = manualOtherDeductionStr ? Number(manualOtherDeductionStr.replace(/,/g, "")) : 0;

  const result = calculateMonthlySalary({
    year,
    month,
    dutyStartDate,
    rank,
    step,
    customBaseSalary: parsedCustomSalary,
    fixedAllowance: parsedFixedAllowance,
    taxRateOption,
    manualOtherDeductions: parsedOtherDeductions,
    schedules,
    manualLeaveCounts: manualLeaves || undefined,
    manualExtraDutyCounts: manualExtra || undefined,
  });

  const ranksList: FirefighterRank[] = ["소방령", "소방경", "소방위", "소방장", "소방교", "소방사"];
  const stepsList = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="relative inline-block text-left">
      {/* 1. 우측 상단 컴팩트 라벨 배지 (실수령액 기준 표기) */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3a312a] hover:bg-[#4a3f37] border border-[#FFC90E]/40 text-[#FFC90E] rounded-full text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
        title="bak님 당월 예상 실수령액 명세서 보기"
      >
        <span className="text-[10px] bg-[#FFC90E]/20 text-[#FFC90E] px-1.5 py-0.5 rounded-md font-extrabold">
          🔒 bak
        </span>
        <span>💰 {month}월 실수령 {Math.floor(result.netTotalSalary / 10000).toLocaleString()}만원</span>
        <span className="text-[10px] text-gray-400">▼</span>
      </button>

      {/* 2. 클릭 시 열리는 상세 보수 및 실수령액 명세서 팝업 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[#2f2a25] border border-brownBorder/50 rounded-2xl w-full max-w-lg shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]">

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#3a312a] border-b border-brownBorder/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#FFC90E]">
                    {year}년 {month}월 예상 보수 및 실수령액 명세서
                  </h3>
                  <p className="text-[10px] text-gray-400">공무원보수규정 [별표 10] 원본 + 공제 내역 적용</p>
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
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">호봉 선택 ([별표10] 1~31호봉)</label>
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

                {/* 봉급 수동 수정 & 기타 고정수당 */}
                <div className="pt-2 border-t border-brownBorder/20 space-y-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] text-gray-400">봉급(기본급) 수동 수정</label>
                      {customBaseSalary && (
                        <button
                          onClick={() => handleCustomSalaryChange("")}
                          className="text-[10px] text-rose-300 hover:underline"
                        >
                          법정 [별표10] 기본값으로 초기화
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={`법정 호봉가: ${getBaseSalaryByStep(rank, step).toLocaleString()}원`}
                      value={customBaseSalary}
                      onChange={(e) => handleCustomSalaryChange(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg bg-gray-900 text-white border border-brownBorder/50 text-xs outline-none focus:ring-1 focus:ring-amber-400 placeholder-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">
                        기타 고정수당 (직급보조/급식비 등)
                      </label>
                      <input
                        type="text"
                        placeholder="870,490"
                        value={fixedAllowance}
                        onChange={(e) => handleFixedAllowanceChange(e.target.value)}
                        className="w-full p-2 rounded-lg bg-gray-900 text-white border border-brownBorder/50 text-xs outline-none focus:ring-1 focus:ring-amber-400 placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">
                        원천징수 세율 선택
                      </label>
                      <div className="flex gap-1">
                        {([80, 100, 120] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleTaxRateChange(opt)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                              taxRateOption === opt
                                ? "bg-amber-600 border-amber-400 text-white"
                                : "bg-gray-800 border-brownBorder/50 text-gray-400 hover:text-white"
                            }`}
                          >
                            {opt}%
                          </button>
                        ))}
                      </div>
                    </div>
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

              {/* 1. 보수 지급 내역 (세전) */}
              <div className="bg-[#3a312a] p-4 rounded-xl border border-brownBorder/30 space-y-2">
                <p className="font-bold text-gray-300 text-xs border-b border-brownBorder/20 pb-2">
                  📊 {rank} {step}호봉 보수 지급 내역 (세전)
                </p>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-gray-200">
                    <span>💵 봉급 (기본급)</span>
                    <span className="font-bold">{result.baseSalary.toLocaleString()}원</span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-300">
                    <span>➕ 당번 초과근무 수당 ({result.totalDutyCount}회)</span>
                    <span className="font-bold">+{result.totalDutyPay.toLocaleString()}원</span>
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
                    <div className="flex justify-between items-center text-amber-300">
                      <span>➕ 기타 고정 수당 합계</span>
                      <span className="font-bold">+{parsedFixedAllowance.toLocaleString()}원</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-brownBorder/20 flex justify-between items-center font-bold text-white text-xs">
                    <span>── 세전 보수 총계</span>
                    <span className="text-amber-300">{result.grossTotalSalary.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 2. 공제 항목 내역 (세후 차감) */}
              <div className="bg-[#352e27] p-4 rounded-xl border border-brownBorder/30 space-y-2">
                <p className="font-bold text-rose-300 text-xs border-b border-brownBorder/20 pb-2 flex justify-between items-center">
                  <span>➖ 공제 항목 내역 (세후 차감)</span>
                  <span className="text-[10px] text-gray-400 font-normal">세율 {taxRateOption}% 적용</span>
                </p>

                <div className="space-y-1.5 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>• 일반기여금 (공무원연금 9%)</span>
                    <span>-{result.deductions.pension.toLocaleString()}원</span>
                  </div>

                  <div className="flex justify-between">
                    <span>• 건강보험료 + 장기요양보험료</span>
                    <span>-{(result.deductions.healthInsurance + result.deductions.longTermCare).toLocaleString()}원</span>
                  </div>

                  <div className="flex justify-between">
                    <span>• 소득세 + 지방소득세 ({taxRateOption}%)</span>
                    <span>-{(result.deductions.incomeTax + result.deductions.localIncomeTax).toLocaleString()}원</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>• 기타 공제 (식대/공제회/조합비 등)</span>
                    <input
                      type="text"
                      value={manualOtherDeductionStr}
                      onChange={(e) => handleOtherDeductionsChange(e.target.value)}
                      className="w-24 text-right p-1 bg-gray-900 rounded border border-brownBorder/30 text-xs text-rose-200 outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-brownBorder/20 flex justify-between items-center font-bold text-rose-300 text-xs">
                    <span>── 총 공제액 합계</span>
                    <span>-{result.deductions.totalDeductions.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 3. 최종 예상 실수령액 요약 */}
              <div className="bg-[#3d3329] p-4 rounded-xl border border-[#FFC90E]/40 flex flex-col items-end gap-1 shadow-lg">
                <p className="text-xs text-amber-200 font-bold">💰 {year}년 {month}월 예상 실수령액 (세후)</p>
                <p className="text-xl sm:text-2xl font-black text-[#FFC90E]">
                  {result.netTotalSalary.toLocaleString()}원
                </p>
                <p className="text-[11px] text-amber-200/80 font-bold">
                  ({numberToKorean(result.netTotalSalary)})
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  세전 보수총액 {result.grossTotalSalary.toLocaleString()}원 - 공제합계 {result.deductions.totalDeductions.toLocaleString()}원
                </p>
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
