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
      let rawData = serviceAccountKey.trim().replace(/^['"]|['"]$/g, '');
      let jsonString = "";

      // 1. Base64 판별 및 디코딩
      if (!rawData.startsWith('{')) {
        try {
          jsonString = Buffer.from(rawData, 'base64').toString('utf-8');
          console.log("Decoded Base64 Service Account Key");
        } catch (e) {
          jsonString = rawData; // Base64 아니면 원본 사용
        }
      } else {
        jsonString = rawData;
      }

      // 2. JSON 파싱
      const serviceAccount = JSON.parse(jsonString);

      // 3. 필수 필드 존재 확인
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error("Missing required fields in Service Account JSON (project_id, private_key, client_email)");
      }

      // 4. 비밀키 줄바꿈 보정 (가장 확실한 방법)
      serviceAccount.private_key = serviceAccount.private_key
        .replace(/\\n/g, '\n')
        .replace(/\n/g, '\n');

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
