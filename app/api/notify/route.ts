import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let initError: string | null = null;

if (!getApps().length) {
  try {
    let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      initError = "FIREBASE_SERVICE_ACCOUNT_KEY is missing.";
    } else {
      // 불필요한 공백이나 따옴표만 제거하고 바로 파싱
      const cleanedKey = serviceAccountKey.trim().replace(/^'|'$/g, '');
      const serviceAccount = JSON.parse(cleanedKey);

      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("Firebase Admin Initialized successfully");
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
      // iOS 전용 설정 추가 (소리 및 우선순위)
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
      // 안드로이드 전용 설정
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          clickAction: "TOP_STORY_ACTIVITY",
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
