import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

if (!getApps().length) {
  try {
    let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      serviceAccountKey = serviceAccountKey.trim();
      if (serviceAccountKey.startsWith("'") && serviceAccountKey.endsWith("'")) {
        serviceAccountKey = serviceAccountKey.slice(1, -1);
      }

      const serviceAccount = JSON.parse(serviceAccountKey);
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
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (!getApps().length) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    // 'family' 주제에 토큰 등록
    const response = await getMessaging().subscribeToTopic(token, "family");
    console.log("Successfully subscribed to topic:", response);

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Error subscribing to topic:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
