# 모바일 푸시 알림 및 PWA 구현 계획 (v2: 전체 알림 방식)

사용자와 배우자가 로그인 여부에 상관없이 스마트폰에서 실시간 일정 알림을 받을 수 있도록 **FCM Topic(주제) 구독** 방식을 도입합니다.

## 주요 변경 사항 (업그레이드)

### 1. 주제(Topic) 구독 방식 도입
*   누구에게 보낼지(UserId) 계산하지 않고, `family`라는 주제에 가입된 모든 기기에 알림을 보냅니다.
*   내가 등록해도 내 폰과 배우자 폰 모두 알림이 옵니다.

### 2. 로그인 의존성 제거
*   로그인하지 않은 상태에서도 앱을 열기만 하면 알림 권한을 요청하고 토큰을 서버에 등록합니다.

---

## 상세 수정 내역

### [NotificationPermission 컴포넌트](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/components/NotificationPermission.tsx) [MODIFY]
*   로그인 체크(`localStorage.getItem("userId")`) 로직을 제거합니다.
*   권한 허용 즉시 FCM 토큰을 받아 새로 만들 `/api/subscribe` 엔드포인트로 전송합니다.

### [/api/subscribe API](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/api/subscribe/route.ts) [NEW]
*   받은 토큰을 Firebase Admin SDK의 `subscribeToTopic` 기능을 사용하여 `family` 주제에 강제로 가입시킵니다.

### [/api/notify API](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/api/notify/route.ts) [MODIFY]
*   특정 사용자의 토큰을 Firestore에서 찾지 않고, 바로 `topic: "family"`로 메시지를 발송합니다.
*   Firestore 조회가 사라지므로 속도가 더 빨라지고 오류 가능성이 줄어듭니다.

### [ScheduleInput 컴포넌트](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/schedule/components/ScheduleInput.tsx) [MODIFY]
*   상대방 아이디를 계산하는 복잡한 로직을 지우고, 단순히 알림 내용만 서버로 보냅니다.

---

## 검증 계획

### 수동 확인
1.  **배포 후**: 스마트폰에서 앱에 접속 시 즉시 알림 권한 팝업이 뜨는지 확인.
2.  **알림 확인**: 한 기기에서 일정 등록 시, 해당 기기 포함 모든 설치 기기에 알림이 오는지 확인.
3.  **잠금 화면**: 폰 화면이 꺼진 상태에서도 카카오톡처럼 알림이 쌓이는지 확인.

> [!IMPORTANT]
> 이 작업은 기존에 Vercel에 설정하신 환경 변수들을 그대로 사용합니다. 추가 설정은 필요 없으며, 제가 코드를 수정한 후 다시 Push만 하면 적용됩니다.

---

**이 계획으로 진행할까요?** 승인해 주시면 구체적인 Firebase 키 설정 방법과 함께 구현을 시작하도록 하겠습니다.
