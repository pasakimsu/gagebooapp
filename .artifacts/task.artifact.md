# 표 가독성 개선 및 확대 기능 구현 태스크 리스트

- [x] 라이브러리 설치
    - [x] `react-zoom-pan-pinch` 설치
- [x] 브라우저 줌 제한 해제
    - [x] `app/layout.tsx`의 viewport 메타데이터 수정
- [x] 표 디자인 초슬림화 및 줌 기능 적용
    - [x] `app/calcul/components/BudgetComparisonTable.tsx` 수정
    - [x] 여백 최소화 및 글자 크기 상향 (`12px`)
    - [x] `TransformWrapper`를 이용한 확대/축소 제스처 적용
- [ ] 최종 테스트 및 배포
    - [ ] 모바일 기기에서 핀치-투-줌 작동 확인
    - [ ] 가로 스크롤 없이 가독성 확인
