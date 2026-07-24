import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Push notifications will not work.");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { targetUserId, title, body } = await req.json();

    if (!targetUserId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!admin.apps.length) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    // 1. Firestore에서 대상 사용자의 FCM 토큰 가져오기
    const db = admin.firestore();
    const tokenDoc = await db.collection("fcmTokens").doc(targetUserId).get();

    if (!tokenDoc.exists) {
      return NextResponse.json({ error: "Token not found for user" }, { status: 404 });
    }

    const registrationToken = tokenDoc.data()?.token;

    if (!registrationToken) {
      return NextResponse.json({ error: "Token is empty" }, { status: 404 });
    }

    // 2. 메시지 전송
    const message = {
      notification: {
        title,
        body,
      },
      token: registrationToken,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
