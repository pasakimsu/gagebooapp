# 알림 스위치 및 관리자 기능 구현 태스크 리스트

- [ ] 알림 구독/해제 API 고도화
    - [ ] `app/api/subscribe/route.ts`에서 `unsubscribe` 액션 처리 추가
- [ ] NotificationPermission 컴포넌트 UI/UX 개편
    - [ ] 계정별(`admin` vs 일반) 권한 분기 로직 추가
    - [ ] Tailwind CSS를 이용한 세련된 토글 스위치 구현
    - [ ] 스위치 조작 시 즉시 서버와 연동 (구독/해제)
- [ ] 최종 테스트 및 배포
    - [ ] `admin` 로그인 시 테스트 버튼 확인
    - [ ] 일반 계정 로그인 시 스위치 작동 확인
