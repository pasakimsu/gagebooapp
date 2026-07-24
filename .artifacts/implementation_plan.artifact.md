# 모바일 푸시 알림 및 PWA 기능 도입 계획

사용자와 배우자가 스마트폰 잠금화면에서 카카오톡처럼 알림을 받을 수 있도록 **Firebase Cloud Messaging(FCM)**과 **PWA(Progressive Web App)** 기술을 도입합니다.

## User Review Required

> [!IMPORTANT]
> 푸시 알림 기능을 정상적으로 작동시키기 위해서는 다음 두 가지 설정이 반드시 필요합니다.
> 1. **Firebase VAPID 키 생성**: Firebase 콘솔 -> 프로젝트 설정 -> 클라우드 메시징에서 '웹 푸시 인증'의 키를 생성하여 알려주셔야 합니다.
> 2. **Firebase 서비스 계정 키**: 서버에서 알림을 보내기 위해 서비스 계정 JSON 파일이 필요합니다. Vercel 환경 변수에 설정하는 방법을 안내해 드릴 예정입니다.
> 3. **PWA 아이콘**: 홈 화면에 설치했을 때 보일 앱 아이콘(192x192, 512x512) 이미지 파일이 있으면 좋습니다.

## Proposed Changes

### 1. PWA 설정 (Progressive Web App)
웹사이트를 스마트폰에 앱처럼 설치할 수 있게 하여, 알림 수신율을 높이고 실제 앱과 같은 경험을 제공합니다.

#### [NEW] [manifest.ts](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/manifest.ts)
*   앱 이름, 아이콘, 배경색 등 PWA 설정 파일 생성.

#### [MODIFY] [layout.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/layout.tsx)
*   PWA 관련 메타태그(Theme Color 등) 추가.

---

### 2. Firebase 메시징 연동
브라우저와 백그라운드에서 알림을 수신하기 위한 설정을 진행합니다.

#### [MODIFY] [firebase.ts](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/lib/firebase.ts)
*   `getMessaging` 초기화 및 내보내기.

#### [NEW] [firebase-messaging-sw.js](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/public/firebase-messaging-sw.js)
*   앱이 꺼져있을 때(백그라운드) 알림을 받아 잠금화면에 표시해주는 서비스 워커 스크립트.

---

### 3. 알림 권한 및 토큰 관리
사용자의 기기 식별값(FCM 토큰)을 수집하여 Firestore에 저장합니다.

#### [NEW] [NotificationPermission.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/components/NotificationPermission.tsx)
*   사용자에게 알림 권한을 요청하고, 허용 시 토큰을 받아 `fcmTokens` 컬렉션에 저장하는 컴포넌트.

---

### 4. 알림 전송 백엔드 (API)
일정이 등록될 때 배우자의 기기로 알림을 쏘아주는 로직입니다.

#### [NEW] [route.ts](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/api/notify/route.ts)
*   Firebase Admin SDK를 사용하여 특정 사용자에게 알림을 전송하는 API 엔드포인트.

#### [MODIFY] [ScheduleInput.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/schedule/components/ScheduleInput.tsx)
*   일정 등록 완료 후, 상대방(배우자)에게 알림을 보내는 API 호출 로직 추가.

## Verification Plan

### Automated Tests
*   `FCM 토큰 저장 확인`: 로그인 후 알림 권한 허용 시 Firestore `fcmTokens`에 데이터가 들어오는지 확인.
*   `API 전송 테스트`: Postman이나 cURL을 통해 `/api/notify`로 테스트 메시지 발송.

### Manual Verification
*   **안드로이드/iOS**: 웹사이트 접속 후 '홈 화면에 추가'를 통해 설치한 뒤, 알림 권한을 허용하고 일정을 등록했을 때 실제 폰에서 알림이 오는지 확인.
*   **잠금 화면**: 폰 화면을 끄고 알림이 왔을 때 스택 형태로 쌓이는지 확인.

---

**이 계획으로 진행할까요?** 승인해 주시면 구체적인 Firebase 키 설정 방법과 함께 구현을 시작하도록 하겠습니다.
