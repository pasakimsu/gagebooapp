import {
  FirefighterRank,
  TaxRateOption,
  DeductionBreakdown,
  getRankSalaryRate,
  calculateLeaveDeduction,
  calculateExtraDutyPay,
  calculateDeductions,
} from "./salaryData";

export interface ScheduleItem {
  id?: string;
  date: string; // YYYY-MM-DD 또는 YYYY-M-D
  content: string;
}

export interface LeaveCounts {
  당번연가: number;
  야간연가: number;
  주간연가: number;
}

export interface ExtraDutyCounts {
  당번대기: number;
  야간대기: number;
  주간대기: number;
}

export interface SalaryCalculationResult {
  year: number; // 급여 지급년도 (예: 2026)
  month: number; // 급여 지급월 (예: 11월)
  workYear: number; // 근무 실적 년도 (예: 2026)
  workMonth: number; // 근무 실적 월 (예: 10월)
  usePreviousMonthSchedule: boolean;
  rank: FirefighterRank;
  step: number;
  baseSalary: number; // 법정 지정 봉급 (원)
  hourlyOvertime: number; // 시간외수당 단가
  hourlyNight: number; // 야간수당 단가
  dailyHoliday: number; // 휴일수당 단가
  weekdayDutyCount: number; // 평일 당번 횟수
  holidayDutyCount: number; // 휴일/주말 당번 횟수
  totalDutyCount: number; // 총 당번 횟수
  totalDutyHours: number; // 총 당번 시수 (N회 × 24h)
  regularWorkHours: number; // 봉급에 포함된 월 정규근무시간 (166h)
  overtimeHours: number; // 시간외 인정시간 (총당번시수 - 166h)
  nightHours: number; // 야간수당 인정시간 (당번횟수 × 8h)
  overtimePay: number; // 시간외수당 금액 (원)
  nightPay: number; // 야간수당 금액 (원)
  holidayDutyPay: number; // 휴일수당 금액 (원)
  totalDutyPay: number; // 당번 초과근무 수당 총액 (원)
  leaveCounts: LeaveCounts; // 감지/설정된 연가 횟수
  leaveDeductionTotal: number; // 연가 차감 총액 (원)
  extraDutyCounts: ExtraDutyCounts; // 감지/설정된 대기근무 횟수
  extraDutyPayTotal: number; // 대기근무 수당 총액 (원)
  fixedAllowance: number; // 기타 고정수당 합계 (직급보조비/급식비/위험수당 등)
  grossTotalSalary: number; // 세전 보수 총계 (봉급 + 초과수당 + 고정수당)
  taxRateOption: TaxRateOption; // 원천징수 세율 (80% / 100% / 120%)
  deductions: DeductionBreakdown; // 세부 공제 내역 (기여금/건보료/소득세/기타공제)
  netTotalSalary: number; // 예상 실수령액 (세후 원 = 세전보수총계 - 총공제액)
}

/**
 * 특정 날짜의 3조 1교대(당비비) 근무 구분 반환
 */
export function getDutyLabel(date: Date, dutyStartDate: Date): "당번" | "비번" {
  const start = new Date(dutyStartDate);
  const target = new Date(date);
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const index = ((diff % 3) + 3) % 3;
  return index === 0 ? "당번" : "비번";
}

/**
 * 주말(토/일) 여부 확인
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * 날짜 객체를 YYYY-MM-DD 및 YYYY-M-D 형태로 포맷
 */
export function formatDateFormats(date: Date): { std: string; old: string } {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const std = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const old = `${y}-${m}-${d}`;
  return { std, old };
}

/**
 * 당월 예상 월급, 공제 내역 및 실수령액 계산 함수
 * (소방공무원 보수 규정: N월 20일 급여 수당 = N-1월 [전월 1일~31일] 실제 근무 실적 기반 계산)
 */
export function calculateMonthlySalary({
  year,
  month,
  dutyStartDate,
  rank = "소방교",
  step = 11,
  customBaseSalary,
  fixedAllowance = 862490,
  taxRateOption = 80,
  manualOtherDeductions,
  schedules = [],
  manualLeaveCounts,
  manualExtraDutyCounts,
}: {
  year: number;
  month: number;
  dutyStartDate: Date;
  rank?: FirefighterRank;
  step?: number;
  customBaseSalary?: number;
  fixedAllowance?: number;
  taxRateOption?: TaxRateOption;
  manualOtherDeductions?: number;
  schedules?: ScheduleItem[];
  manualLeaveCounts?: LeaveCounts;
  manualExtraDutyCounts?: ExtraDutyCounts;
}): SalaryCalculationResult {
  const rate = getRankSalaryRate(rank, step, customBaseSalary);

  // 초과근무 수당은 전월 근무 실적으로 고정 계산 (익월 20일 급여 지급 규정)
  let workYear = year;
  let workMonth = month - 1;
  if (month === 1) {
    workYear = year - 1;
    workMonth = 12;
  }

  // 1. 근무 실적 월의 일수 계산 및 근무 스캔
  const daysInWorkMonth = new Date(workYear, workMonth, 0).getDate();
  let weekdayDutyCount = 0;
  let holidayDutyCount = 0;

  const autoLeaveCounts: LeaveCounts = { 당번연가: 0, 야간연가: 0, 주간연가: 0 };
  const autoExtraDutyCounts: ExtraDutyCounts = { 당번대기: 0, 야간대기: 0, 주간대기: 0 };

  for (let day = 1; day <= daysInWorkMonth; day++) {
    const date = new Date(workYear, workMonth - 1, day);
    const { std, old } = formatDateFormats(date);
    const label = getDutyLabel(date, dutyStartDate);

    if (label === "당번") {
      if (isWeekend(date)) {
        holidayDutyCount++;
      } else {
        weekdayDutyCount++;
      }
    }

    // 2. 일정 감지
    const daySchedules = schedules.filter((s) => s.date === std || s.date === old);
    for (const sched of daySchedules) {
      const text = sched.content.trim();

      // 연가 키워드 감지
      if (text.includes("당번연가") || text.includes("연가(당번)")) autoLeaveCounts.당번연가++;
      else if (text.includes("야간연가") || text.includes("연가(야간)")) autoLeaveCounts.야간연가++;
      else if (text.includes("주간연가") || text.includes("연가(주간)")) autoLeaveCounts.주간연가++;

      // 대기/희망근무 키워드 감지
      if (text.includes("당번대기") || text.includes("대기(당번)") || text.includes("희망(당번)")) autoExtraDutyCounts.당번대기++;
      else if (text.includes("야간대기") || text.includes("대기(야간)") || text.includes("희망(야간)")) autoExtraDutyCounts.야간대기++;
      else if (text.includes("주간대기") || text.includes("대기(주간)") || text.includes("희망(주간)")) autoExtraDutyCounts.주간대기++;
    }
  }

  // 사용자가 수동 설정한 값이 있으면 사용, 없으면 자동 스캔값 사용
  const leaveCounts = manualLeaveCounts || autoLeaveCounts;
  const extraDutyCounts = manualExtraDutyCounts || autoExtraDutyCounts;

  // 3. 3조 1교대(당비비) 초과근무 수당 산출
  // 월 정규근무시간(기본급으로 커버되는 기준시간): 약 166시간
  const totalDutyCount = weekdayDutyCount + holidayDutyCount;
  const totalDutyHours = totalDutyCount * 24;
  const regularWorkHours = 166;

  // 시간외 인정시간 = 총 당번 시수 (N회 × 24h) - 정규근무시간 (166h)
  const overtimeHours = Math.max(0, totalDutyHours - regularWorkHours);
  const overtimePay = overtimeHours * rate.hourlyOvertime;

  // 야간수당 인정시간 = 당번 횟수 × 8h (22:00 ~ 06:00)
  const nightHours = totalDutyCount * 8;
  const nightPay = nightHours * rate.hourlyNight;

  // 휴일수당 인정일수 = 휴일/주말 당번 횟수
  const holidayDutyPay = holidayDutyCount * rate.dailyHoliday;

  // 당번 초과근무 수당 총액 = 시간외수당 + 야간수당 + 휴일수당
  const totalDutyPay = overtimePay + nightPay + holidayDutyPay;

  const leaveDeductionTotal =
    leaveCounts.당번연가 * calculateLeaveDeduction(rate, "당번연가") +
    leaveCounts.야간연가 * calculateLeaveDeduction(rate, "야간연가") +
    leaveCounts.주간연가 * calculateLeaveDeduction(rate, "주간연가");

  const extraDutyPayTotal =
    extraDutyCounts.당번대기 * calculateExtraDutyPay(rate, "당번대기") +
    extraDutyCounts.야간대기 * calculateExtraDutyPay(rate, "야간대기") +
    extraDutyCounts.주간대기 * calculateExtraDutyPay(rate, "주간대기");

  // 세전 보수 총계 = 봉급 + 당번초과수당 + 대기수당 - 연가차감액 + 기타고정수당
  const grossTotalSalary = rate.baseSalary + totalDutyPay + extraDutyPayTotal - leaveDeductionTotal + fixedAllowance;

  // 4. 공제 항목 및 실수령액 산출
  const deductions = calculateDeductions({
    grossSalary: grossTotalSalary,
    taxRateOption,
    manualOtherDeductions,
  });

  const netTotalSalary = grossTotalSalary - deductions.totalDeductions;

  return {
    year,
    month,
    workYear,
    workMonth,
    usePreviousMonthSchedule: true,
    rank,
    step,
    baseSalary: rate.baseSalary,
    hourlyOvertime: rate.hourlyOvertime,
    hourlyNight: rate.hourlyNight,
    dailyHoliday: rate.dailyHoliday,
    weekdayDutyCount,
    holidayDutyCount,
    totalDutyCount,
    totalDutyHours,
    regularWorkHours,
    overtimeHours,
    nightHours,
    overtimePay,
    nightPay,
    holidayDutyPay,
    totalDutyPay,
    leaveCounts,
    leaveDeductionTotal,
    extraDutyCounts,
    extraDutyPayTotal,
    fixedAllowance,
    grossTotalSalary,
    taxRateOption,
    deductions,
    netTotalSalary,
  };
}
