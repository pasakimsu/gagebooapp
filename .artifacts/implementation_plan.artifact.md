# 달력 월 이동 연동 및 계급/호봉(1~31호봉) 선택 기능 추가 계획

달력 넘김(`<` / `>`) 시 해당 월의 연가/대기/당번 일정이 자동으로 연동되어 예상 월급이 재계산되도록 보완하고, 계급뿐만 아니라 **1호봉~31호봉(호봉별 봉급표 데이터)**을 직접 선택/설정할 수 있는 기능 개선 계획입니다.

---

## User Review Required

> [!IMPORTANT]
> **주요 개선 항목**
> 1. **달력 월 이동 실시간 연동**:
>    - `CalendarView`의 `onActiveStartDateChange` 이벤트를 연동하여 달력을 넘길 때(`<`, `>`) 보이는 년/월의 당번 횟수 및 일정을 즉시 스캔하여 수당 명세서를 자동으로 재계산합니다.
> 2. **계급 + 호봉(1호봉 ~ 31호봉) 선택 기능**:
>    - 2026년 소방공무원 봉급표 기준 **1호봉부터 31호봉까지의 급여표 데이터**를 구축합니다.
>    - 계급(소방령~소방사)과 호봉(1호봉~31호봉)을 각각 드롭다운으로 선택할 수 있으며, 선택한 호봉이 `localStorage`에 자동 저장됩니다.
>    - 필요한 경우 본인의 정확한 기본급을 수동으로 입력/수정할 수도 있는 기능도 제공합니다.

---

## Proposed Changes

### 1. 호봉별 봉급표 데이터 확장

#### [MODIFY] [salaryData.ts](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/lib/salaryData.ts)
- 계급별(소방령, 소방경, 소방위, 소방장, 소방교, 소방사) **1호봉 ~ 31호봉 2026년 봉급표 데이터 구조** 구현
- 계급 + 호봉 선택 시 해당 기본급 및 통상 초과수당 단가 자동 산출 함수 제공

---

### 2. 달력 월 변경 이벤트 연동

#### [MODIFY] [CalendarView.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/schedule/components/CalendarView.tsx)
- `onActiveStartDateChange` 콜백을 추가하여 사용자가 달력에서 월을 변경할 때(`onActiveMonthChange`) 보이는 날짜(Date) 전달

#### [MODIFY] [page.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/schedule/page.tsx)
- 캘린더에서 활성화된 월(`currentViewDate`)을 상태로 관리하여 `SalaryEstimateBadge`에 전달

---

### 3. 우측 상단 배지 및 모달 개선

#### [MODIFY] [SalaryEstimateBadge.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/schedule/components/SalaryEstimateBadge.tsx)
- 모달 내 **계급 드롭다운**과 **호봉 드롭다운(1~31호봉)** 추가
- 사용자 지정 기본급 입력 폼 옵션 추가
- 계급 및 호봉 설정 저장 (`localStorage`)

---

## Verification Plan

### Automated Tests
- Next.js 빌드 테스트 (`npm run build`)
- 호봉별 기본급 및 초과수당 산출 단위 테스트

### Manual Verification
- 달력에서 `<` / `>` 버튼으로 월을 변경할 때 우측 상단 배지의 금액과 모달 내용이 해당 월로 즉시 갱신되는지 확인
- 계급과 호봉(예: 소방교 10호봉 ➔ 소방장 15호봉) 변경 시 기본급과 예상 수령액이 정확하게 변경되는지 확인
