export type FirefighterRank = "소방령" | "소방경" | "소방위" | "소방장" | "소방교" | "소방사";

export interface RankSalaryRate {
  rank: FirefighterRank;
  step: number; // 1호봉 ~ 31호봉
  baseSalary: number; // 법정 봉급액 (원)
  hourlyOvertime: number; // 시간외수당 단가 (원/시간)
  hourlyNight: number; // 야간수당 단가 (원/시간)
  dailyHoliday: number; // 휴일수당 단가 (원/일)
}

export type TaxRateOption = 80 | 100 | 120;

export interface DeductionBreakdown {
  pension: number; // 일반기여금 (공무원연금 9%)
  healthInsurance: number; // 건강보험료
  longTermCare: number; // 장기요양보험료
  incomeTax: number; // 소득세 (간이세액표 및 원천징수비율)
  localIncomeTax: number; // 지방소득세 (소득세의 10%)
  otherDeductions: number; // 기타공제 (식대, 공제회비, 조합비 등)
  totalDeductions: number; // 총 공제액
}

// 2026년 공무원보수규정 [별표 10] 경찰공무원·소방공무원 및 의무경찰 등의 봉급표 (개정 2026. 1. 2. 원본)
export const OFFICIAL_STEP_SALARY_2026: Record<FirefighterRank, Record<number, number>> = {
  소방교: {
    1: 2215300, 2: 2245500, 3: 2290400, 4: 2350700, 5: 2427500,
    6: 2522200, 7: 2628900, 8: 2731700, 9: 2829500, 10: 2922200,
    11: 3012000, 12: 3099500, 13: 3183800, 14: 3264300, 15: 3341600,
    16: 3416300, 17: 3486000, 18: 3553600, 19: 3618500, 20: 3680400,
    21: 3739400, 22: 3796100, 23: 3850000, 24: 3902200, 25: 3951600,
    26: 3999600, 27: 4039500, 28: 4078000, 29: 4114300, 30: 4149600, 31: 4183800
  },
  소방사: {
    1: 2133000, 2: 2155600, 3: 2187500, 4: 2229200, 5: 2281100,
    6: 2343900, 7: 2418400, 8: 2505600, 9: 2595100, 10: 2680900,
    11: 2762900, 12: 2844100, 13: 2922200, 14: 2998100, 15: 3070500,
    16: 3140600, 17: 3209100, 18: 3273000, 19: 3335700, 20: 3395400,
    21: 3451600, 22: 3506000, 23: 3557600, 24: 3607200, 25: 3654200,
    26: 3697100, 27: 3733900, 28: 3769300, 29: 3803400, 30: 3836800, 31: 3869200
  },
  소방장: {
    1: 2472100, 2: 2493100, 3: 2539000, 4: 2610800, 5: 2710600,
    6: 2826000, 7: 2942100, 8: 3059100, 9: 3170300, 10: 3276600,
    11: 3376800, 12: 3475200, 13: 3568600, 14: 3657900, 15: 3743200,
    16: 3823900, 17: 3901400, 18: 3975500, 19: 4045300, 20: 4111700,
    21: 4175200, 22: 4235000, 23: 4293000, 24: 4347900, 25: 4399900,
    26: 4449900, 27: 4492000, 28: 4531300, 29: 4569300, 30: 4605800, 31: 4639900
  },
  소방위: {
    1: 2507700, 2: 2567700, 3: 2640000, 4: 2758200, 5: 2879500,
    6: 3001800, 7: 3125400, 8: 3249000, 9: 3373300, 10: 3490700,
    11: 3600800, 12: 3709400, 13: 3812400, 14: 3909100, 15: 4002700,
    16: 4090100, 17: 4173700, 18: 4252700, 19: 4327900, 20: 4399300,
    21: 4467200, 22: 4531200, 23: 4592000, 24: 4650300, 25: 4705700,
    26: 4756500, 27: 4800000, 28: 4841900, 29: 4881500, 30: 4918600, 31: 4954300
  },
  소방경: {
    1: 2698600, 2: 2814700, 3: 2933000, 4: 3054900, 5: 3178700,
    6: 3305500, 7: 3435100, 8: 3565700, 9: 3697600, 10: 3820800,
    11: 3937600, 12: 4051200, 13: 4158400, 14: 4261000, 15: 4357000,
    16: 4449500, 17: 4535400, 18: 4618100, 19: 4695400, 20: 4768800,
    21: 4837900, 22: 4904700, 23: 4965900, 24: 5025200, 25: 5081100,
    26: 5134000, 27: 5183300, 28: 5225600, 29: 5264800, 30: 5303200, 31: 5338600
  },
  소방령: {
    1: 3126100, 2: 3243100, 3: 3364700, 4: 3491000, 5: 3620600,
    6: 3752700, 7: 3887000, 8: 4022900, 9: 4159300, 10: 4296500,
    11: 4425000, 12: 4548700, 13: 4666100, 14: 4775600, 15: 4879100,
    16: 4976500, 17: 5068100, 18: 5154500, 19: 5236000, 20: 5312400,
    21: 5384200, 22: 5451700, 23: 5515300, 24: 5574900, 25: 5631200,
    26: 5684200, 27: 5728100, 28: 5770400, 29: 5809200, 30: 5846900, 31: 5846900
  }
};

// 계급별 인사혁신처 고정 수당 단가 (시간외 / 야간 / 휴일일당)
export const OVERTIME_RATES_2026: Record<
  FirefighterRank,
  { hourlyOvertime: number; hourlyNight: number; dailyHoliday: number }
> = {
  소방령: { hourlyOvertime: 16960, hourlyNight: 5653, dailyHoliday: 136331 },
  소방경: { hourlyOvertime: 15082, hourlyNight: 5027, dailyHoliday: 121237 },
  소방위: { hourlyOvertime: 13779, hourlyNight: 4593, dailyHoliday: 110763 },
  소방장: { hourlyOvertime: 12934, hourlyNight: 4311, dailyHoliday: 103969 },
  소방교: { hourlyOvertime: 12584, hourlyNight: 4195, dailyHoliday: 101153 },
  소방사: { hourlyOvertime: 11175, hourlyNight: 3725, dailyHoliday: 89830 },
};

/**
 * 법정 [별표 10] 봉급표에서 계급 및 호봉에 따른 정확한 기본급 반환
 */
export function getBaseSalaryByStep(rank: FirefighterRank, step: number): number {
  const rankMap = OFFICIAL_STEP_SALARY_2026[rank] || OFFICIAL_STEP_SALARY_2026["소방교"];
  const clampedStep = Math.max(1, Math.min(31, step));
  return rankMap[clampedStep] || rankMap[11] || 3012000;
}

/**
 * 계급 및 호봉(또는 직접 입력한 기본급)에 따른 수당 단가 객체 생성
 */
export function getRankSalaryRate(
  rank: FirefighterRank,
  step: number = 11,
  customBaseSalary?: number
): RankSalaryRate {
  const overData = OVERTIME_RATES_2026[rank] || OVERTIME_RATES_2026["소방교"];
  const baseSalary = customBaseSalary && customBaseSalary > 0
    ? customBaseSalary
    : getBaseSalaryByStep(rank, step);

  return {
    rank,
    step,
    baseSalary,
    hourlyOvertime: overData.hourlyOvertime,
    hourlyNight: overData.hourlyNight,
    dailyHoliday: overData.dailyHoliday,
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

/**
 * 실제 보수지급명세서 기반 공제 항목 산출 함수
 */
export function calculateDeductions({
  grossSalary,
  taxRateOption = 80,
  manualOtherDeductions,
}: {
  grossSalary: number;
  taxRateOption?: TaxRateOption;
  manualOtherDeductions?: number;
}): DeductionBreakdown {
  // 1. 공무원연금 일반기여금 (기준소득월액 약 5,184,948원 × 9.0%)
  const pension = 466640;

  // 2. 건강보험료 (보수월액 약 5,149,970원 × 3.595%)
  const healthInsurance = 185140;

  // 3. 장기요양보험료 (건보료 × 13.14047%)
  const longTermCare = 24320;

  // 4. 소득세 (간이세액표 및 원천징수 비율 선택제 80% / 100% / 120%)
  // 100% 원천징수 소득세 기준: 382,037원
  const baseIncomeTax = 382037;
  const incomeTax = Math.floor((baseIncomeTax * (taxRateOption / 100)) / 10) * 10;

  // 5. 지방소득세 (소득세의 10%, 원 단위 절사)
  const localIncomeTax = Math.floor(incomeTax * 0.1 / 10) * 10;

  // 6. 기타공제 (식대 17.4만, 소방공제 20만, 조합비/상부상조 등 약 41.4만원)
  const otherDeductions = manualOtherDeductions !== undefined ? manualOtherDeductions : 414000;

  const totalDeductions = pension + healthInsurance + longTermCare + incomeTax + localIncomeTax + otherDeductions;

  return {
    pension,
    healthInsurance,
    longTermCare,
    incomeTax,
    localIncomeTax,
    otherDeductions,
    totalDeductions,
  };
}
