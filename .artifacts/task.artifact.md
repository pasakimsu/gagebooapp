# 계산기 UI 개선 구현 태스크 리스트

- [ ] 데이터 인터페이스 및 fetch 로직 확장
    - [ ] `app/calcul/page.tsx`의 `Budget` 인터페이스 수정
    - [ ] `fetchUserBudgets`에서 원본 데이터(allowance, salary) 필드 추가
- [ ] 이중 테이블 UI 구현
    - [ ] `app/calcul/components/BudgetComparisonTable.tsx` 수정
    - [ ] 상단: 원천 데이터 테이블 추가 (5일 수당, 20일 월급, 합계)
    - [ ] 하단: 기존 배분 결과 테이블 유지 및 레이아웃 조정
- [ ] 실시간 데이터 연동 보완
    - [ ] '계산하기' 버튼 클릭 시 즉시 하단 표에 반영되는지 확인
- [ ] 디자인 및 폰트 일관성 점검
