import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
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

    if (!admin.apps.length) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    // 'family' 주제에 토큰 등록
    const response = await admin.messaging().subscribeToTopic(token, "family");
    console.log("Successfully subscribed to topic:", response);

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Error subscribing to topic:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
