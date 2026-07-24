import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let initError: string | null = null;

if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          // Vercel 환경 변수에서 줄바꿈이 깨지는 경우를 대비한 보정
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log("Firebase Admin Initialized with individual variables");
    } else {
      // 구버전(JSON 방식) 하위 호환성 유지
      let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        let rawData = serviceAccountKey.trim().replace(/^['"]|['"]$/g, '');
        let jsonString = rawData.startsWith('{') ? rawData : Buffer.from(rawData, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(jsonString);
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        initializeApp({ credential: cert(serviceAccount) });
      } else {
        initError = "Firebase environment variables are missing.";
      }
    }
  } catch (error: any) {
    initError = `Init error: ${error.message}`;
    console.error("Firebase Admin initialization error:", error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, body } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!getApps().length) {
      return NextResponse.json({
        error: "Firebase Admin not initialized",
        details: initError || "Unknown initialization failure"
      }, { status: 500 });
    }

    // 'family' 주제를 구독한 모든 기기에 메시지 전송
    const message = {
      notification: {
        title,
        body,
      },
      topic: "family",
      // iOS 전용 설정 최적화
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: "default",
            badge: 1,
            // 'active' 상태가 아니어도 알림을 띄우도록 설정
            interruptionLevel: "active" as const,
          },
        },
      },
      // 안드로이드 전용 설정 최적화
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "family_channel",
        },
      },
    };

    const response = await getMessaging().send(message);
    console.log("Successfully sent topic message:", response);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error("Error sending topic notification:", error);
    return NextResponse.json({
      error: "Failed to send notification",
      details: error.message
    }, { status: 500 });
  }
}
