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
      const cleanedKey = serviceAccountKey.trim().replace(/^'|'$/g, '');
      const serviceAccount = JSON.parse(cleanedKey);

      initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } catch (error: any) {
    initError = `Init error: ${error.message}`;
    console.error("Firebase Admin initialization error:", error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (!getApps().length) {
      return NextResponse.json({
        error: "Firebase Admin not initialized.",
        details: initError || "Unknown initialization failure"
      }, { status: 500 });
    }

    // 'family' 주제에 토큰 등록
    const response = await getMessaging().subscribeToTopic(token, "family");
    console.log("Successfully subscribed to topic:", response);

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error("Error subscribing to topic:", error);
    return NextResponse.json({
      error: "Subscription failed",
      details: error.message
    }, { status: 500 });
  }
}
