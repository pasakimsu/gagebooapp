import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

if (!getApps().length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const serviceAccount = serviceAccountKey ? JSON.parse(serviceAccountKey) : null;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, body } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!getApps().length) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    // 'family' 주제를 구독한 모든 기기에 메시지 전송
    const message = {
      notification: {
        title,
        body,
      },
      topic: "family",
    };

    const response = await getMessaging().send(message);
    console.log("Successfully sent topic message:", response);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    console.error("Error sending topic notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
