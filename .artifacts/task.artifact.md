# 모바일 푸시 알림 및 PWA 구현 태스크 리스트 (v2: Topic 방식)

- [x] PWA 관련 파일 설정
    - [x] `app/manifest.ts` 생성
    - [x] `app/layout.tsx` 메타데이터 수정
- [/] FCM Topic 기반 알림 시스템 구축
    - [ ] `components/NotificationPermission.tsx` 수정 (로그인 체크 제거, 구독 호출)
    - [ ] `app/api/subscribe/route.ts` 신규 생성 (Topic 구독 API)
    - [ ] `app/api/notify/route.ts` 수정 (Topic 발송 방식)
    - [ ] `app/schedule/components/ScheduleInput.tsx` 수정 (전체 알림 발송)
- [ ] 최종 검증 및 배포 안내
