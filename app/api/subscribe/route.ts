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
    } else {
      let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        let rawData = serviceAccountKey.trim().replace(/^['"]|['"]$/g, '');
        let jsonString = rawData.startsWith('{') ? rawData : Buffer.from(rawData, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(jsonString);
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        initializeApp({ credential: cert(serviceAccount) });
      }
    }
  } catch (error: any) {
    initError = error.message;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json();

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    if (!getApps().length) return NextResponse.json({ error: "Init failed", details: initError }, { status: 500 });

    const db = getFirestore();
    const messaging = getMessaging();

    // 1. 'family' 주제에 기기 등록
    await messaging.subscribeToTopic(token, "family");

    // 2. Firestore에 토큰 정보 기록 (확인용)
    const docId = `${userId || 'unknown'}_${token.substring(0, 8)}`;
    await db.collection("fcmTokens").doc(docId).set({
      token,
      userId: userId || "guest",
      platform: "ios/pwa",
      updatedAt: new Date(),
    });

    console.log(`Token registered and saved: ${docId}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
