# 계산기 표 가독성 개선 및 확대 제스처 도입 계획

사용자께서 표의 글씨가 여전히 작다고 느끼시는 문제를 해결하기 위해, 여백을 극단적으로 줄여 글자 크기를 더 확보하고, 모바일에서 **핀치-투-줌(Pinch-to-zoom)** 제스처로 표를 자유롭게 확대해서 볼 수 있는 기능을 추가합니다.

## User Review Required

> [!IMPORTANT]
> **확대 제스처 기능**을 구현하기 위해 `react-zoom-pan-pinch`라는 가벼운 라이브러리를 설치하여 사용할 예정입니다. 이 라이브러리는 스마트폰에서 두 손가락으로 벌려 확대하거나 드래그하여 표를 옮겨 보는 기능을 제공합니다.

## Proposed Changes

### 1. 전역 줌 제한 해제
#### [MODIFY] [RootLayout](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/layout.tsx)
*   `viewport` 설정에서 `maximumScale: 1`을 제거하여, 브라우저 기본 확대 기능이 작동할 수 있는 기반을 마련합니다.

### 2. 표 디자인 초슬림화 (여백 최소화)
#### [MODIFY] [BudgetComparisonTable](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/calcul/components/BudgetComparisonTable.tsx)
*   테이블 셀(`td`, `th`)의 패딩을 `p-0` 수준으로 더 줄입니다.
*   남는 공간을 활용해 글자 크기를 한 단계 더 키웁니다 (`text-[12px]`).

### 3. 확대/축소 제스처 전용 컴포넌트 적용
#### [MODIFY] [BudgetComparisonTable](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/calcul/components/BudgetComparisonTable.tsx)
*   `TransformWrapper`를 사용하여 테이블을 감쌉니다.
*   **기능**:
    *   두 손가락으로 벌리면 표가 커집니다.
    *   확대된 상태에서 손가락으로 밀어서 다른 칸을 볼 수 있습니다.
    *   더블 탭 시 원래 크기로 돌아옵니다.

## Verification Plan

### Automated Tests
*   `npm install react-zoom-pan-pinch` 실행 확인.

### Manual Verification
1.  **배포 후**: 스마트폰에서 계산기 페이지 접속.
2.  **가독성 확인**: 이전보다 글자가 더 커졌는지 확인.
3.  **제스처 테스트**:
    *   표 영역에 두 손가락을 대고 벌렸을 때 표만 부드럽게 확대되는지 확인.
    *   확대한 상태에서 손가락으로 밀어 표의 구석구석이 잘 보이는지 확인.
    *   두 번 톡톡 쳤을 때 원래 크기로 복구되는지 확인.
