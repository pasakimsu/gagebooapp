import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

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
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log("Firebase Admin Initialized with individual variables");
    } else {
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

    const messaging = getMessaging();
    const db = getFirestore();

    // 1. Firestore에서 활성화된 FCM 토큰들을 수집하고 동일 기기 중복 토큰 제거(Set)
    const tokenSnapshot = await db.collection("fcmTokens").get();
    const rawTokens: string[] = [];

    tokenSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.token && data.subscribed !== false) {
        rawTokens.push(data.token);
      }
    });

    const uniqueTokens = Array.from(new Set(rawTokens));
    console.log(`Sending multicast notification to ${uniqueTokens.length} unique device tokens.`);

    const notificationPayload = {
      notification: {
        title,
        body,
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          title,
          body,
          icon: "/next.svg",
          badge: "/next.svg",
          tag: "family-notification", // OS/브라우저 레벨 알림 창 중복 결합
        },
        fcmOptions: {
          link: "/",
        },
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "family_channel",
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: "default",
            badge: 1,
            mutableContent: true,
            contentAvailable: true,
            interruptionLevel: "time-sensitive" as const,
          },
        },
      },
    };

    let responseSummary: any;

    if (uniqueTokens.length > 0) {
      // 2-A. 고유 기기 토큰들로 0.1초 즉시 멀티캐스트 전송 (가장 확실하고 단일 발송 보장)
      const multicastResponse = await messaging.sendEachForMulticast({
        tokens: uniqueTokens,
        ...notificationPayload,
      });
      console.log(`Multicast success: ${multicastResponse.successCount}, failure: ${multicastResponse.failureCount}`);
      responseSummary = multicastResponse;
    } else {
      // 2-B. 기기 토큰이 없는 경우 fallback으로 'family' 주제로 전송
      const topicResponse = await messaging.send({
        topic: "family",
        ...notificationPayload,
      });
      console.log("Topic fallback response:", topicResponse);
      responseSummary = topicResponse;
    }

    return NextResponse.json({ success: true, details: responseSummary });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json({
      error: "Failed to send notification",
      details: error.message
    }, { status: 500 });
  }
}
