export type FirefighterRank = "소방령" | "소방경" | "소방위" | "소방장" | "소방교" | "소방사";

export interface RankSalaryRate {
  rank: FirefighterRank;
  baseSalary: number; // 기준호봉 급여 (원)
  hourlyOvertime: number; // 시간외수당 단가 (원/시간)
  hourlyNight: number; // 야간수당 단가 (원/시간)
  dailyHoliday: number; // 휴일수당 단가 (원/일)
}

// 2026년 소방공무원 계급별 수당 단가표 (세전 기준)
export const SALARY_RATES_2026: Record<FirefighterRank, RankSalaryRate> = {
  소방령: {
    rank: "소방령",
    baseSalary: 4296500,
    hourlyOvertime: 16960,
    hourlyNight: 5653,
    dailyHoliday: 136331,
  },
  소방경: {
    rank: "소방경",
    baseSalary: 3820800,
    hourlyOvertime: 15082,
    hourlyNight: 5027,
    dailyHoliday: 121237,
  },
  소방위: {
    rank: "소방위",
    baseSalary: 3490700,
    hourlyOvertime: 13779,
    hourlyNight: 4593,
    dailyHoliday: 110763,
  },
  소방장: {
    rank: "소방장",
    baseSalary: 3276600,
    hourlyOvertime: 12934,
    hourlyNight: 4311,
    dailyHoliday: 103969,
  },
  소방교: {
    rank: "소방교",
    baseSalary: 3187900,
    hourlyOvertime: 12584,
    hourlyNight: 4195,
    dailyHoliday: 101153,
  },
  소방사: {
    rank: "소방사",
    baseSalary: 2831000,
    hourlyOvertime: 11175,
    hourlyNight: 3725,
    dailyHoliday: 89830,
  },
};

/**
 * 24시간 당번 근무 1회당 발생하는 기본 초과수당 계산
 * (시간외 24시간 + 야간 8시간)
 */
export function calculateDutyShiftPay(rate: RankSalaryRate, isHoliday: boolean = false): number {
  const basePay = rate.hourlyOvertime * 24 + rate.hourlyNight * 8;
  return isHoliday ? basePay + rate.dailyHoliday : basePay;
}

/**
 * 연가 사용 시 차감되는 수당 계산
 */
export function calculateLeaveDeduction(
  rate: RankSalaryRate,
  leaveType: "주간연가" | "야간연가" | "당번연가"
): number {
  switch (leaveType) {
    case "주간연가":
      return rate.hourlyOvertime * 1;
    case "야간연가":
      return rate.hourlyOvertime * 7 + rate.hourlyNight * 8;
    case "당번연가":
      return rate.hourlyOvertime * 16 + rate.hourlyNight * 8;
    default:
      return 0;
  }
}

/**
 * 대기/희망근무 시 추가되는 초과수당 계산
 */
export function calculateExtraDutyPay(
  rate: RankSalaryRate,
  dutyType: "주간대기" | "야간대기" | "당번대기"
): number {
  switch (dutyType) {
    case "주간대기":
      return rate.hourlyOvertime * 9;
    case "야간대기":
      return rate.hourlyOvertime * 15 + rate.hourlyNight * 8;
    case "당번대기":
      return rate.hourlyOvertime * 24 + rate.hourlyNight * 8;
    default:
      return 0;
  }
}
