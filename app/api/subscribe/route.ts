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
