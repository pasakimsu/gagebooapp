import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
      // Fallback for older env var
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(serviceAccountKey.replace(/\\n/g, '\n'));
        initializeApp({ credential: cert(serviceAccount) });
      }
    }
  } catch (error) {
    console.error("Diagnostic API Init Error:", error);
  }
}

export async function GET() {
  try {
    const db = getFirestore();

    // 1. 'loans' 컬렉션의 모든 문서 확인
    const loansSnapshot = await db.collection("loans").get();
    const loansData = loansSnapshot.docs.map(doc => ({
      collection: "loans",
      id: doc.id,
      data: doc.data()
    }));

    // 2. 다른 혹시 모를 이름의 컬렉션 확인
    const collections = await db.listCollections();
    const collectionNames = collections.map(c => c.id);

    return NextResponse.json({
      collectionNames,
      loansData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
