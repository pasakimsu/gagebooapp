# 모바일 푸시 알림 및 PWA 구현 완료

사용자와 배우자가 스마트폰에서 앱처럼 가계부를 사용하고, 일정이 등록될 때 알림을 받을 수 있도록 모든 설정을 마쳤습니다.

## 주요 변경 사항

### 1. PWA(Progressive Web App) 도입
*   **[manifest.ts](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/manifest.ts)**: 스마트폰 홈 화면에 설치했을 때의 이름, 색상, 아이콘 등을 정의했습니다.
*   **[layout.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/layout.tsx)**: 모바일 브라우저에서 앱처럼 보일 수 있도록 메타데이터를 추가하고, 모든 페이지에서 알림 권한을 관리하도록 설정했습니다.

### 2. 푸시 알림 인프라 구축
*   **[firebase-messaging-sw.js](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/public/firebase-messaging-sw.js)**: 앱이 꺼져 있어도 알림을 수신할 수 있게 해주는 서비스 워커를 추가했습니다.
*   **[NotificationPermission.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/components/NotificationPermission.tsx)**: 앱 접속 시 알림 권한을 요청하고, 기기별 토큰(FCM 토큰)을 Firestore에 자동으로 저장합니다.
*   **[api/notify/route.ts](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/api/notify/route.ts)**: 특정 사용자에게 알림을 쏘아주는 서버 API를 구축했습니다.

### 3. 일정 알림 연동
*   **[ScheduleInput.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/schedule/components/ScheduleInput.tsx)**: 일정을 등록하면 자동으로 상대방(배우자)에게 "새로운 일정이 등록되었습니다"라는 알림을 전송합니다.

## 사용을 위한 필수 설정 (중요!)

기능이 실제로 동작하려면 **Firebase 콘솔**에서 아래 값들을 가져와 `.env.local` 파일에 추가해야 합니다.

> [!IMPORTANT]
> 1. **NEXT_PUBLIC_FIREBASE_VAPID_KEY**:
>    *   Firebase 콘솔 -> 프로젝트 설정 -> 클라우드 메시징 -> 웹 푸시 인증에서 생성된 '키 쌍'을 복사해서 넣으세요.
> 2. **FIREBASE_SERVICE_ACCOUNT_KEY**:
>    *   Firebase 콘솔 -> 프로젝트 설정 -> 서비스 계정 -> '새 비공개 키 생성' 버튼 클릭 후 다운로드된 JSON 파일 내용을 **한 줄짜리 문자열**로 만들어 넣으세요.
>    *   예: `FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'`

## 테스트 방법
1.  스마트폰 브라우저(크롬 또는 사파리)로 웹사이트 접속.
2.  브라우저 메뉴에서 **'홈 화면에 추가'**를 선택하여 설치.
3.  설치된 앱을 열고 로그인하면 **알림 권한 요청** 팝업이 뜹니다. '허용'을 누르세요.
4.  배우자분도 동일하게 설치 및 허용을 완료합니다.
5.  한 명의 기기에서 일정을 등록해 보세요. 상대방 폰에 알림이 오는지 확인합니다.

---
모든 구현이 완료되었습니다. 위 환경 변수 설정만 완료하시면 바로 사용 가능합니다!
