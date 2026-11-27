export type FirefighterRank = "소방령" | "소방경" | "소방위" | "소방장" | "소방교" | "소방사";

export interface RankSalaryRate {
  rank: FirefighterRank;
  step: number; // 1호봉 ~ 31호봉
  baseSalary: number; // 봉급액 (원)
  hourlyOvertime: number; // 시간외수당 단가 (원/시간)
  hourlyNight: number; // 야간수당 단가 (원/시간)
  dailyHoliday: number; // 휴일수당 단가 (원/일)
}

// 2026년 실제 보수명세서 기반 기준 단가 및 11호봉 봉급표
// 소방교 11호봉 실제 봉급: 3,012,000원
// 단가: 시간외 12,584원 / 야간 4,195원 / 휴일 101,153원
export const BASE_ANCHOR_SALARY_2026: Record<
  FirefighterRank,
  { step11Salary: number; hourlyOvertime: number; hourlyNight: number; dailyHoliday: number }
> = {
  소방령: { step11Salary: 4296500, hourlyOvertime: 16960, hourlyNight: 5653, dailyHoliday: 136331 },
  소방경: { step11Salary: 3820800, hourlyOvertime: 15082, hourlyNight: 5027, dailyHoliday: 121237 },
  소방위: { step11Salary: 3490700, hourlyOvertime: 13779, hourlyNight: 4593, dailyHoliday: 110763 },
  소방장: { step11Salary: 3276600, hourlyOvertime: 12934, hourlyNight: 4311, dailyHoliday: 103969 },
  소방교: { step11Salary: 3012000, hourlyOvertime: 12584, hourlyNight: 4195, dailyHoliday: 101153 },
  소방사: { step11Salary: 2831000, hourlyOvertime: 11175, hourlyNight: 3725, dailyHoliday: 89830 },
};

// 2026년 소방공무원 계급/호봉별 봉급표 (소방교 11호봉 = 3,012,000원 기준)
export function getBaseSalaryByStep(rank: FirefighterRank, step: number): number {
  const anchor = BASE_ANCHOR_SALARY_2026[rank].step11Salary;
  const clampedStep = Math.max(1, Math.min(31, step));

  // 계급별 호봉간 평균 봉급 인상 차액 (소방교 기준 1호봉당 약 7.4만원)
  const stepDiffMap: Record<FirefighterRank, number> = {
    소방령: 105000,
    소방경: 95000,
    소방위: 88000,
    소방장: 82000,
    소방교: 74000,
    소방사: 68000,
  };

  const diff = stepDiffMap[rank] || 74000;
  const stepOffset = clampedStep - 11;
  return Math.round(anchor + stepOffset * diff);
}

/**
 * 계급 및 호봉(또는 직접 입력한 기본급)에 따른 수당 단가 객체 생성
 */
export function getRankSalaryRate(
  rank: FirefighterRank,
  step: number = 11,
  customBaseSalary?: number
): RankSalaryRate {
  const anchorData = BASE_ANCHOR_SALARY_2026[rank] || BASE_ANCHOR_SALARY_2026["소방교"];
  const baseSalary = customBaseSalary && customBaseSalary > 0
    ? customBaseSalary
    : getBaseSalaryByStep(rank, step);

  // 시간외/야간/휴일 단가는 정부 인사혁신처 지정 계급별 고정 단가 사용
  return {
    rank,
    step,
    baseSalary,
    hourlyOvertime: anchorData.hourlyOvertime,
    hourlyNight: anchorData.hourlyNight,
    dailyHoliday: anchorData.dailyHoliday,
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
