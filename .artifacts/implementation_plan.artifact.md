# 알림 관리 기능 고도화 계획

사용자 편의성을 위해 **관리자 전용 테스트 기능**과 **일반 사용자용 알림 ON/OFF 스위치**를 도입합니다.

## Proposed Changes

### 1. 알림 구독/해제 API 확장
#### [MODIFY] [api/subscribe/route.ts](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/app/api/subscribe/route.ts)
*   `action` 파라미터를 추가하여 구독(`subscribe`)과 해제(`unsubscribe`)를 모두 처리할 수 있게 합니다.
*   구독 해제 시 Firebase Admin의 `unsubscribeFromTopic`을 호출하고 Firestore 상태를 업데이트합니다.

### 2. 사용자별 맞춤 UI 구현
#### [MODIFY] [NotificationPermission.tsx](file:///C:/Users/nalb/OneDrive/바탕 화면/최종본/myhome-web-main/components/NotificationPermission.tsx)
*   **권한 분기**: 현재 로그인된 `userId`를 확인하여 UI를 다르게 보여줍니다.
    *   `admin` 계정: 기존처럼 **[전송 테스트]** 버튼을 유지합니다.
    *   일반 계정: 알림 수신 여부를 결정하는 **토글 스위치(Switch)**를 보여줍니다.
*   **상태 관리**: 알림이 활성화(ON) 상태인지 비활성화(OFF) 상태인지 시각적으로 표현합니다.
*   **토글 로직**: 스위치를 조작할 때마다 서버 API를 호출하여 즉시 알림 그룹 가입/탈퇴를 처리합니다.

## Verification Plan

### Manual Verification
1.  **관리자 테스트**: `admin`으로 로그인 시 [전송 테스트] 버튼이 잘 보이고 작동하는지 확인합니다.
2.  **일반 사용자 테스트**: 일반 계정으로 로그인 시 토글 스위치가 보이는지 확인합니다.
3.  **토글 기능 확인**:
    *   스위치를 **OFF**로 하면 이후 다른 기기에서 일정을 등록해도 알림이 오지 않아야 합니다.
    *   스위치를 **ON**으로 하면 다시 알림이 정상적으로 수신되어야 합니다.
4.  **디자인 확인**: 스위치가 ON일 때 파란색/초록색으로 활성화된 모습으로 보이는지 확인합니다.
