import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
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
  } else if (serviceAccountKey) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountKey.replace(/\\n/g, '\n'))),
    });
  }
}

export async function GET() {
  try {
    const db = getFirestore();

    // 복구할 데이터 (V13의 주택담보대출 + V14의 신용대출 통합)
    const restoredData = {
      home: {
        amount: "400,000,000",
        startDate: "2026-08-03",
        repaymentDay: "21",
        period: "360",
        periodUnit: "month",
        rate: "2.8",
        method: "체증식",
        partialRepayments: [
          { "date": "2028-07-21", "amount": "50,000,000" },
          { "date": "2029-07-12", "amount": "30,000,000" }
        ],
        monthlyPayment: 0,
        lastMonthPayment: 0
      },
      park: {
        amount: "49,000,000",
        startDate: "2026-03-05",
        repaymentDay: "21",
        period: "12",
        periodUnit: "month",
        rate: "4.17",
        partialRepayments: [],
        method: "만기일시",
        monthlyPayment: 170275,
        lastMonthPayment: 49170275
      },
      kim: {
        amount: "23,000,000",
        startDate: "2026-03-31",
        repaymentDay: "21",
        period: "12",
        periodUnit: "month",
        rate: "4.32",
        partialRepayments: [],
        method: "만기일시",
        monthlyPayment: 82800,
        lastMonthPayment: 23082800
      }
    };

    // 현재 앱이 사용하는 V14 문서에 덮어쓰기
    await db.collection("loans").doc("loanStateV14").set(restoredData);

    return NextResponse.json({ success: true, message: "Loan data restored to V14 successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
