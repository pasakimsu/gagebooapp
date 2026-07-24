# 모바일 푸시 알림 및 PWA 구현 태스크 리스트

- [ ] PWA 관련 파일 설정
    - [ ] `app/manifest.ts` 생성
    - [ ] `app/layout.tsx` 메타데이터 수정
- [ ] Firebase 메시징 기초 설정
    - [ ] `lib/firebase.ts`에 Messaging 초기화 추가
    - [ ] `public/firebase-messaging-sw.js` (서비스 워커) 생성
- [ ] 알림 권한 및 토큰 관리 UI 구현
    - [ ] `components/NotificationPermission.tsx` 생성
    - [ ] 레이아웃에 컴포넌트 추가
- [ ] 알림 전송 서버 로직 구현
    - [ ] `firebase-admin` 라이브러리 설치
    - [ ] `app/api/notify/route.ts` API 엔드포인트 생성
- [ ] 일정 등록 시 알림 연동
    - [ ] `app/schedule/components/ScheduleInput.tsx` 수정
- [ ] 최종 검증 및 배포 안내
