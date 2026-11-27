# 사용자별(bak / yong) 작성자 태그 필터링 및 '건강검진' 일정 차감 연동 계획

공유 달력 특성상 배우자(`yong`)가 등록한 `건강검진(yong)` 일정과 본인(`bak`)이 등록한 `건강검진(bak)` 일정을 **작성자 ID 필터링을 통해 엄격히 구분**하여, 본인(`bak`)의 월급 계산 시 배우자의 일정은 오인식되지 않도록 방지하는 보정 계획입니다.

---

## 🔍 작성자 구분(bak vs yong) 및 일정 오인식 방지 원리

### 1. 일정 저장 구조 확인
- 달력에 일정을 등록할 때, Firestore DB에는 작성자 정보가 자동으로 붙어서 저장됩니다:
  - 본인 등록 시: `content: "건강검진 (bak)"`, `userId: "bak"`
  - 배우자 등록 시: `content: "건강검진 (yong)"`, `userId: "yong"`

### 2. 작성자 필터링 수당 감지 로직 (`lib/salaryCalculator.ts`)
- 월급 계산기(`bak` 전용)에서 일정을 스캔할 때:
  - `s.userId === "bak"` 이거나 `s.content.includes("(bak)")`인 일정만 **선별적으로 스캔**.
  - `(yong)` 태그가 붙어 있거나 `userId === "yong"`인 배우자 일정은 **완전히 제외/무시**.
- **결과**: 배우자가 `건강검진`을 등록하더라도 본인(`bak`)의 월급 및 연가 차감액에 전혀 영향을 주지 않습니다!

---

## 🛠️ Proposed Changes (수정 구현 계획)

> [!IMPORTANT]
> **사용자 승인 후 구현을 시작합니다.**

### 1. `lib/salaryCalculator.ts` 작성자 필터링 조건 추가
- 일정 스캔 시 조건식 보정:
  ```ts
  const isBakSchedule = sched.userId === "bak" || sched.content.includes("(bak)");
  if (!isBakSchedule) continue; // 배우자(yong) 일정은 완전히 건너뜀!
  ```
- 본인(`bak`)의 일정 중 `건강검진`, `검진`, `공가`, `주간연가`가 기재된 항목만 **`주간연가`로 정상 차감 반영**.

---

## Verification Plan

### Manual Verification
- 사용자 승인 후 연동 시, 배우자(`yong`) 계정으로 `건강검진`을 등록하고, 본인(`bak`) 계정으로 `건강검진`을 등록한 후, `bak` 전용 월급 명세서에 본인의 `건강검진`만 정확히 차감 반영되는지 테스트.
