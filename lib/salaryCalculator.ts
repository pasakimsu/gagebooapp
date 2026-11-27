import {
  FirefighterRank,
  TaxRateOption,
  DeductionBreakdown,
  getRankSalaryRate,
  calculateExtraDutyPay,
  calculateDeductions,
} from "./salaryData";
import { isWeekendOrHoliday } from "./holidayUtils";

export interface ScheduleItem {
  id?: string;
  date: string; // YYYY-MM-DD 또는 YYYY-M-D
  content: string;
  userId?: string;
}

export interface LeaveCounts {
  당번연가: number;
  야간연가: number;
  주간연가: number;
  육아시간: number;
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
  weekdayDutyCount: number; // 스케줄 상 평일 당번 횟수
  holidayDutyCount: number; // 스케줄 상 휴일/주말/대체공휴일 당번 횟수
  effectiveHolidayDutyCount: number; // 실제 근무한 휴일 당번 횟수 (휴일연가 차감 반영)
  totalDutyCount: number; // 스케줄 상 총 당번 횟수
  effectiveDutyCount: number; // 실제 근무 당번 횟수 (총당번 - 당번연가)
  totalDutyHours: number; // 실제 근무 당번 시수 (N회 × 24h)
  regularWorkHours: number; // 봉급에 포함된 월 정규근무시간 (166h)
  partialLeaveHours: number; // 주간/야간연가/육아시간 차감 시수 (12h/2h/회)
  overtimeHours: number; // 시간외 인정시간 (실제당번시수 - 166h - 부분연가시수)
  nightHours: number; // 야간수당 인정시간 (실제당번횟수 × 8h)
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
  let autoHolidayLeaveCount = 0;

  const autoLeaveCounts: LeaveCounts = { 당번연가: 0, 야간연가: 0, 주간연가: 0, 육아시간: 0 };
  const autoExtraDutyCounts: ExtraDutyCounts = { 당번대기: 0, 야간대기: 0, 주간대기: 0 };

  for (let day = 1; day <= daysInWorkMonth; day++) {
    const date = new Date(workYear, workMonth - 1, day);
    const { std, old } = formatDateFormats(date);
    const label = getDutyLabel(date, dutyStartDate);
    const isHol = isWeekendOrHoliday(date); // 주말 및 대체공휴일/국경일 포함 검증

    if (label === "당번") {
      if (isHol) {
        holidayDutyCount++;
      } else {
        weekdayDutyCount++;
      }
    }

    // 2. 일정 감지 (bak 작성자 전용 일정만 스캔, 배우자 yong 일정 제외)
    const daySchedules = schedules.filter((s) => s.date === std || s.date === old);
    for (const sched of daySchedules) {
      const text = sched.content.trim();
      const schedUser = sched.userId;

      // 배우자(yong) 전용 일정은 명시적으로 제외
      if (schedUser === "yong" || (text.includes("(yong)") && !text.includes("(bak)"))) {
        continue;
      }

      // bak 작성 일정이거나 본인 연관 일정일 때만 감지
      const isBakSchedule =
        schedUser === "bak" ||
        text.includes("(bak)") ||
        (!text.includes("(yong)") && (schedUser === undefined || schedUser === null));

      if (!isBakSchedule) continue;

      // 연가 키워드 감지 (주간연가 + 건강검진 / 검진 / 공가 / 육아시간 추가)
      if (text.includes("당번연가") || text.includes("연가(당번)")) {
        autoLeaveCounts.당번연가++;
        if (label === "당번" && isHol) {
          autoHolidayLeaveCount++;
        }
      } else if (text.includes("야간연가") || text.includes("연가(야간)")) {
        autoLeaveCounts.야간연가++;
      } else if (text.includes("육아시간")) {
        autoLeaveCounts.육아시간++;
      } else if (
        text.includes("주간연가") ||
        text.includes("연가(주간)") ||
        text.includes("건강검진") ||
        text.includes("검진") ||
        text.includes("공가")
      ) {
        autoLeaveCounts.주간연가++;
      }

      // 대기/희망근무 키워드 감지
      if (text.includes("당번대기") || text.includes("대기(당번)") || text.includes("희망(당번)")) autoExtraDutyCounts.당번대기++;
      else if (text.includes("야간대기") || text.includes("대기(야간)") || text.includes("희망(야간)")) autoExtraDutyCounts.야간대기++;
      else if (text.includes("주간대기") || text.includes("대기(주간)") || text.includes("희망(주간)")) autoExtraDutyCounts.주간대기++;
    }
  }

  // 사용자가 수동 설정한 값이 있으면 사용, 없으면 자동 스캔값 사용
  const leaveCounts = manualLeaveCounts || autoLeaveCounts;
  const extraDutyCounts = manualExtraDutyCounts || autoExtraDutyCounts;

  // 3. 3조 1교대(당비비) 초과근무 수당 산출 범용 통합 수식
  const totalDutyCount = weekdayDutyCount + holidayDutyCount;

  // 실제 근무한 당번 횟수 = 스케줄상 당번 횟수 - 당번연가 횟수
  const effectiveDutyCount = Math.max(0, totalDutyCount - leaveCounts.당번연가);
  const actualWorkedDutyHours = effectiveDutyCount * 24;
  const regularWorkHours = 166;

  // 기본 시간외 인정 시수 = 실제 근무 당번 시수(N회 × 24h) - 월 정규근무시간(166h)
  const baseOvertimeHours = Math.max(0, actualWorkedDutyHours - regularWorkHours);

  // 부분연가(주간연가/야간연가 12h, 육아시간 2h) 차감 시수
  const partialLeaveHours = leaveCounts.주간연가 * 12 + leaveCounts.야간연가 * 12 + (leaveCounts.육아시간 || 0) * 2;

  // 최종 시간외 인정 시수 = 기본시간외 - 부분연가차감시수
  const overtimeHours = Math.max(0, baseOvertimeHours - partialLeaveHours);
  const overtimePay = overtimeHours * rate.hourlyOvertime;

  // 야간수당 인정시간 = 실제 근무 당번 횟수 × 8h (22:00 ~ 06:00)
  const nightHours = effectiveDutyCount * 8;
  const nightPay = nightHours * rate.hourlyNight;

  // 실제 근무 휴일 당번 횟수 = 스케줄상 휴일당번 횟수 - 휴일 당번연가 횟수
  const effectiveHolidayDutyCount = Math.max(0, holidayDutyCount - autoHolidayLeaveCount);
  const holidayDutyPay = effectiveHolidayDutyCount * rate.dailyHoliday;

  // 당번 초과근무 수당 총액 = 시간외수당 + 야간수당 + 휴일수당
  const totalDutyPay = overtimePay + nightPay + holidayDutyPay;

  const extraDutyPayTotal =
    extraDutyCounts.당번대기 * calculateExtraDutyPay(rate, "당번대기") +
    extraDutyCounts.야간대기 * calculateExtraDutyPay(rate, "야간대기") +
    extraDutyCounts.주간대기 * calculateExtraDutyPay(rate, "주간대기");

  // 세전 보수 총계 = 봉급 + 당번초과수당 + 대기수당 + 기타고정수당
  const grossTotalSalary = rate.baseSalary + totalDutyPay + extraDutyPayTotal + fixedAllowance;

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
    effectiveHolidayDutyCount,
    totalDutyCount,
    effectiveDutyCount,
    totalDutyHours: actualWorkedDutyHours,
    regularWorkHours,
    partialLeaveHours,
    overtimeHours,
    nightHours,
    overtimePay,
    nightPay,
    holidayDutyPay,
    totalDutyPay,
    leaveCounts,
    leaveDeductionTotal: 0,
    extraDutyCounts,
    extraDutyPayTotal,
    fixedAllowance,
    grossTotalSalary,
    taxRateOption,
    deductions,
    netTotalSalary,
  };
}
