# 일정 등록 시 알림 3개 중복 발송 원인 분석 및 중복 제거 수정 계획

일정을 1회 등록할 때 푸시 알림이 **3개씩 중복 수신되는 원인**을 서비스 워커(`public/firebase-messaging-sw.js`) 코드 분석을 통해 완벽히 규명하고 중복 알림을 제거하는 보정 계획입니다.

---

## 🔍 알림이 3개씩 오던 결정적 원인 파악

### 1. `public/firebase-messaging-sw.js` 서비스 워커의 3중 중복 발송 구조
일정이 등록되면 `/api/notify`에서 FCM 푸시 알림을 전송하는데, 서비스 워커 내부에서 동일한 메시지를 **3개의 서로 다른 수신 경로가 가로채서 알림을 각각 발생**시키고 있었습니다:

1. **1차 알림**: Firebase SDK 자체에서 푸시 메시지(`notification` 페이로드) 수신 시 **기본 자동 알림 발생**
2. **2차 알림**: `messaging.onBackgroundMessage()` 핸들러가 이를 감지하고 `showNotification()`을 수동으로 호출하여 **추가 알림 발생**
3. **3차 알림**: 브라우저 네이티브 `self.addEventListener('push')` 이벤트 가로채기 핸들러가 또다시 `showNotification()`을 호출하여 **세 번째 알림 발생**

👉 한 번의 일정 등록으로 3개의 알림 창이 동시에 팝업되었던 것입니다!

---

## 🛠️ Proposed Changes (수정 구현 계획)

> [!IMPORTANT]
> **사용자 승인 후 수정을 시작합니다.**

### 1. `public/firebase-messaging-sw.js` 알림 중복 처리 제거
- FCM 웹푸시 자동 알림 기능과 중복되는 **`messaging.onBackgroundMessage` 및 네이티브 `push` 이벤트의 수동 `showNotification()` 호출을 정리/통합**.
- **결과**: 일정을 등록할 때 알림이 **딱 1개만 깔끔하게 발송**됩니다!

---

## Verification Plan

### Manual Verification
- 사용자 승인 후 수정 반영 시, 일정을 1건 새로 등록했을 때 모바일/PC 화면에 알림이 중복 없이 정확히 **1개만 오는지 검증**.
