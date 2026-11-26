export type FirefighterRank = "소방령" | "소방경" | "소방위" | "소방장" | "소방교" | "소방사";

export interface RankSalaryRate {
  rank: FirefighterRank;
  step: number; // 1호봉 ~ 31호봉
  baseSalary: number; // 봉급액 (원)
  hourlyOvertime: number; // 시간외수당 단가 (원/시간)
  hourlyNight: number; // 야간수당 단가 (원/시간)
  dailyHoliday: number; // 휴일수당 단가 (원/일)
}

// 2026년 소방공무원 계급별 10호봉 기준 기본 단가표
export const BASE_10STEP_SALARY_2026: Record<FirefighterRank, { baseSalary: number; hourlyOvertime: number; hourlyNight: number; dailyHoliday: number }> = {
  소방령: { baseSalary: 4296500, hourlyOvertime: 16960, hourlyNight: 5653, dailyHoliday: 136331 },
  소방경: { baseSalary: 3820800, hourlyOvertime: 15082, hourlyNight: 5027, dailyHoliday: 121237 },
  소방위: { baseSalary: 3490700, hourlyOvertime: 13779, hourlyNight: 4593, dailyHoliday: 110763 },
  소방장: { baseSalary: 3276600, hourlyOvertime: 12934, hourlyNight: 4311, dailyHoliday: 103969 },
  소방교: { baseSalary: 3187900, hourlyOvertime: 12584, hourlyNight: 4195, dailyHoliday: 101153 },
  소방사: { baseSalary: 2831000, hourlyOvertime: 11175, hourlyNight: 3725, dailyHoliday: 89830 },
};

// 2026년 소방공무원 계급/호봉별 봉급표 (1호봉 ~ 31호봉 추정/공식표 연동)
// 10호봉을 기준으로 호봉당 평균 증가액을 반영한 1~31호봉 산정
export function getBaseSalaryByStep(rank: FirefighterRank, step: number): number {
  const anchor = BASE_10STEP_SALARY_2026[rank].baseSalary;
  const clampedStep = Math.max(1, Math.min(31, step));

  // 계급별 호봉간 평균 봉급 인상 차액 (약 6.5만 ~ 11만원)
  const stepDiffMap: Record<FirefighterRank, number> = {
    소방령: 105000,
    소방경: 95000,
    소방위: 88000,
    소방장: 82000,
    소방교: 78000,
    소방사: 72000,
  };

  const diff = stepDiffMap[rank] || 78000;
  const stepOffset = clampedStep - 10;
  return Math.round(anchor + stepOffset * diff);
}

/**
 * 계급 및 호봉(또는 직접 입력한 기본급)에 따른 수당 단가 객체 생성
 */
export function getRankSalaryRate(
  rank: FirefighterRank,
  step: number = 10,
  customBaseSalary?: number
): RankSalaryRate {
  const anchorData = BASE_10STEP_SALARY_2026[rank] || BASE_10STEP_SALARY_2026["소방교"];
  const baseSalary = customBaseSalary && customBaseSalary > 0
    ? customBaseSalary
    : getBaseSalaryByStep(rank, step);

  // 통상 시급/단가 계산 비율 (10호봉 단가비율 연동)
  const ratio = baseSalary / anchorData.baseSalary;

  const hourlyOvertime = Math.round(anchorData.hourlyOvertime * ratio);
  const hourlyNight = Math.round(anchorData.hourlyNight * ratio);
  const dailyHoliday = Math.round(anchorData.dailyHoliday * ratio);

  return {
    rank,
    step,
    baseSalary,
    hourlyOvertime,
    hourlyNight,
    dailyHoliday,
  };
}

/**
 * 24시간 당번 근무 1회당 발생하는 기본 초과수당 계산
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
