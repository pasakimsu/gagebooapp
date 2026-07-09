"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { db, doc, onSnapshot, updateDoc, setDoc, getDoc } from "@/lib/firebase";

type RepaymentMethod = "원리금균등" | "원금균등" | "만기일시" | "체증식";

interface PartialRepayment {
  date: string;
  amount: string;
}

interface ScheduleRow {
  idx: number;
  date: string;
  total: number;
  principal: number;
  interest: number;
  accInterest: number;
  remain: number;
  year: number;
  month: number;
}

interface LoanState {
  amount: string;
  startDate: string;
  repaymentDay: string;
  period: string;
  periodUnit: "month";
  rate: string;
  partialRepayments: PartialRepayment[];
  method: RepaymentMethod;
  monthlyPayment: number;
  lastMonthPayment: number;
  schedule?: ScheduleRow[];
}

const numberToKorean = (num: number): string => {
  if (num === 0) return "0원";
  const units = ["", "만", "억", "조"];
  let result = "";
  let unitIndex = 0;
  let tempNum = num;
  while (tempNum > 0) {
    const part = tempNum % 10000;
    if (part > 0) result = `${part.toLocaleString()}${units[unitIndex]} ` + result;
    tempNum = Math.floor(tempNum / 10000);
    unitIndex++;
  }
  return result.trim() + "원";
};

const formatNumber = (val: string) => val.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatDateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDiffDays = (d1: Date, d2: Date) => {
  const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

const getRemainingMonths = (startDateStr: string, totalPeriod: string) => {
  if (!startDateStr || !totalPeriod) return 0;
  const start = new Date(startDateStr);
  const now = new Date();
  if (now < start) return Number(totalPeriod);
  const elapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, Number(totalPeriod) - elapsed);
};

const generateHFSchedule60 = (principal: number, annualRate: number, startDateStr: string, payDay: number, partials: PartialRepayment[]): ScheduleRow[] => {
  const schedule: ScheduleRow[] = [];
  const rate = annualRate / 100;
  const start = new Date(startDateStr);

  let firstPayDate = new Date(start.getFullYear(), start.getMonth() + 1, payDay);
  const firstDays = getDiffDays(start, firstPayDate);
  const firstInterest = Math.floor(principal * rate / 365 * firstDays);

  schedule.push({
    idx: 1, date: formatDateLocal(firstPayDate), total: firstInterest, principal: 0, interest: firstInterest, accInterest: 0, remain: principal, year: firstPayDate.getFullYear(), month: firstPayDate.getMonth() + 1
  });

  const D = principal * (4477 / 400000000);
  const S2 = principal * (955709 / 400000000);
  let remain = principal;
  let prevDate = firstPayDate;

  for (let i = 1; i < 60; i++) {
    const currDate = new Date(firstPayDate.getFullYear(), firstPayDate.getMonth() + i, payDay);
    const days = getDiffDays(prevDate, currDate);
    const interest = Math.floor(remain * rate / 365 * days);
    let monthlyTotal = Math.floor(S2 + (i - 1) * D);
    let principalPaid = monthlyTotal - interest;

    const matchingPartials = (partials || []).filter(p => {
      const pDate = new Date(p.date);
      return pDate > prevDate && pDate <= currDate;
    });
    const partialSum = matchingPartials.reduce((sum, p) => sum + Number(p.amount.replace(/,/g, "")), 0);
    if (partialSum > 0) { principalPaid += partialSum; monthlyTotal += partialSum; }

    remain -= principalPaid;
    schedule.push({
      idx: i + 1, date: formatDateLocal(currDate), total: monthlyTotal, principal: Math.max(0, principalPaid), interest: interest, accInterest: 0, remain: Math.max(0, Math.floor(remain)), year: currDate.getFullYear(), month: currDate.getMonth() + 1
    });
    prevDate = currDate;
    if (remain <= 0) break;
  }
  return schedule;
};

const LoanDashboard = ({ home, park, kim }: { home: LoanState, park: LoanState, kim: LoanState }) => {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;

  const homeMonthly = home.schedule?.find(s => s.year === curY && s.month === curM)?.total || 0;
  const isParkStarted = park.startDate ? new Date() >= new Date(park.startDate) : false;
  const isKimStarted = kim.startDate ? new Date() >= new Date(kim.startDate) : false;
  const parkMonthly = isParkStarted ? park.monthlyPayment : 0;
  const kimMonthly = isKimStarted ? kim.monthlyPayment : 0;

  const totalMonthlyDebt = homeMonthly + parkMonthly + kimMonthly;

  const LoanSummaryCard = ({ title, amount, monthly, remainMonths, color }: any) => (
    <div className="bg-[#3a312a] p-4 rounded-2xl border border-brownBorder shadow-md w-full">
      <div className="flex justify-between items-start mb-3">
        <h4 className={`text-base font-bold ${color}`}>{title}</h4>
        <span className="text-[10px] text-gray-400 font-medium bg-black/20 px-2 py-1 rounded">잔여 {remainMonths}개월</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">대출 원금</span>
          <span className="text-white font-bold">{Number(amount.replace(/,/g, "")).toLocaleString()}원</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-gray-400 text-[11px]">이번 달 상환액</span>
          <span className={`text-lg font-black ${color}`}>{monthly.toLocaleString()}원</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4 max-w-full">
      <div className="bg-beigeLight p-5 rounded-3xl shadow-xl text-darkText text-center w-full">
        <p className="text-xs font-bold opacity-70 mb-1">이번 달 총 상환액</p>
        <h3 className="text-2xl font-black">{totalMonthlyDebt.toLocaleString()}원</h3>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <LoanSummaryCard title="🏠 주택담보대출" amount={home.amount || "0"} monthly={homeMonthly} remainMonths={getRemainingMonths(home.startDate, home.period)} color="text-beigeLight" />
        <LoanSummaryCard title="💳 박재현 신용대출" amount={park.amount || "0"} monthly={parkMonthly} remainMonths={getRemainingMonths(park.startDate, park.period)} color="text-yellow-400" />
        <LoanSummaryCard title="💳 김용휘 신용대출" amount={kim.amount || "0"} monthly={kimMonthly} remainMonths={getRemainingMonths(kim.startDate, kim.period)} color="text-yellow-400" />
      </div>
    </div>
  );
};

const LoanCalculator = ({
  type, ownerName, title, state, onStateChange, onCalculate, onReset, color, isHomeLoan
}: {
  type: string, ownerName?: string, title: string, state: LoanState, onStateChange: (newState: LoanState) => void, onCalculate: (targetState?: LoanState) => void, onReset: () => void, color: string, isHomeLoan?: boolean
}) => {
  const [showPartial, setShowPartial] = useState(false);
  const amountNum = Number(state.amount.replace(/,/g, "")) || 0;
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const availableYears = state.schedule ? Array.from(new Set(state.schedule.map(s => s.year))).sort() : [];
  const filteredSchedule = state.schedule?.filter(s => s.year === viewYear) || [];

  const inputClass = "w-full box-border p-3 rounded-lg bg-gray-700 text-white border border-brownBorder outline-none focus:ring-1 focus:ring-beigeLight text-base text-right min-w-0";
  const mainBtnClass = "flex-1 bg-beigeLight text-darkText font-bold py-4 rounded-xl shadow-md active:scale-95 transition text-base";
  const grayBtnClass = "flex-1 bg-gray-600 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition text-base";

  const updatePartialRow = (idx: number, field: keyof PartialRepayment, val: string) => {
    const newList = [...(state.partialRepayments || [])];
    newList[idx] = { ...newList[idx], [field]: field === "amount" ? formatNumber(val) : val };
    onStateChange({ ...state, partialRepayments: newList });
  };

  return (
    <div className="w-full max-w-full bg-[#3a312a] p-4 sm:p-6 rounded-3xl border border-brownBorder shadow-2xl overflow-hidden">
      <h3 className={`text-xl font-bold mb-1 text-center ${color}`}>{title}</h3>
      {ownerName && <p className="text-gray-400 text-center mb-6 font-semibold text-sm">{ownerName}</p>}

      <div className="space-y-5 w-full">
        <div>
          <div className="flex justify-between mb-1 px-1 text-[11px]">
            <label className="text-gray-300 font-semibold">대출금액 (원)</label>
            <span className="font-bold text-beigeLight">{numberToKorean(amountNum)}</span>
          </div>
          <input type="text" value={state.amount} inputMode="numeric" onChange={(e) => onStateChange({ ...state, amount: formatNumber(e.target.value) })} className={inputClass} placeholder="금액 입력" />
        </div>

        {isHomeLoan ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-300 block mb-1 font-semibold px-1 text-[11px]">대출 금리 (%)</label>
                <input type="text" value={state.rate} inputMode="decimal" onChange={(e) => onStateChange({ ...state, rate: e.target.value })} className={inputClass} placeholder="금리" />
              </div>
              <div>
                <label className="text-gray-300 block mb-1 font-semibold px-1 text-[11px]">납입일</label>
                <input type="number" min="1" max="31" value={state.repaymentDay} onChange={(e) => onStateChange({ ...state, repaymentDay: e.target.value })} className={inputClass} placeholder="일" />
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-gray-300 block mb-1 font-semibold px-1 text-[11px]">대출 시작일</label>
                <input type="date" value={state.startDate || ""} onChange={(e) => onStateChange({ ...state, startDate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-gray-300 block mb-1 font-semibold px-1 text-[11px]">대출기간 (개월)</label>
                <input type="text" value={state.period} inputMode="numeric" onChange={(e) => onStateChange({ ...state, period: e.target.value.replace(/[^0-9]/g, "") })} className={inputClass} placeholder="개월" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="text-gray-300 block mb-1 font-semibold px-1 text-[11px]">대출 시작일</label>
              <input type="date" value={state.startDate || ""} onChange={(e) => onStateChange({ ...state, startDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-gray-300 block mb-1 font-semibold px-1 text-[11px]">대출기간 (개월)</label>
              <input type="text" value={state.period} inputMode="numeric" onChange={(e) => onStateChange({ ...state, period: e.target.value.replace(/[^0-9]/g, "") })} className={inputClass} placeholder="개월 수" />
            </div>
            <div>
              <label className="text-gray-300 block mb-1 font-semibold px-1 text-[11px]">대출금리 (%)</label>
              <input type="text" value={state.rate} inputMode="decimal" onChange={(e) => onStateChange({ ...state, rate: e.target.value })} className={inputClass} placeholder="이율" />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => onCalculate()} className={mainBtnClass}>저장</button>
          <button onClick={onReset} className={grayBtnClass}>초기화</button>
        </div>

        {isHomeLoan && (
          <div className="pt-2">
            <button onClick={() => setShowPartial(!showPartial)} className="w-full py-4 rounded-xl border border-dashed border-gray-500 text-gray-400 font-bold hover:bg-white/5 transition text-sm">
              {showPartial ? "🔼 중도상환 닫기" : "🔽 중도상환 내역 관리"}
            </button>
            {showPartial && (
              <div className="mt-4 space-y-4 bg-black/20 p-3 rounded-2xl border border-gray-600 w-full overflow-hidden">
                {state.partialRepayments?.map((p, idx) => (
                  <div key={idx} className="space-y-2 pb-4 border-b border-gray-700 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-gray-500 font-bold">상환 #{idx + 1}</span>
                      <span className="text-[10px] text-yellow-500 font-black">{numberToKorean(Number(p.amount.replace(/,/g, "")) || 0)}</span>
                    </div>
                    <div className="flex gap-2">
                      <input type="date" value={p.date} onChange={(e) => updatePartialRow(idx, "date", e.target.value)} className={inputClass + " flex-[1.5] text-xs px-2"} />
                      <input type="text" value={p.amount} inputMode="numeric" onChange={(e) => updatePartialRow(idx, "amount", e.target.value)} className={inputClass + " flex-1 text-xs px-2"} placeholder="상환액" />
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => onCalculate({ ...state, partialRepayments: state.partialRepayments })} className="bg-beigeLight text-darkText px-2 rounded-lg font-bold text-[10px]">저장</button>
                        <button onClick={() => {
                          const newList = state.partialRepayments.filter((_, i) => i !== idx);
                          onCalculate({ ...state, partialRepayments: newList });
                        }} className="bg-rose-600 text-white px-2 rounded-lg font-bold text-[10px]">삭제</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => onStateChange({ ...state, partialRepayments: [...(state.partialRepayments || []), { date: "", amount: "" }] })} className="w-full py-3 rounded-xl bg-gray-700 text-white font-black text-xl hover:bg-gray-600 transition">+</button>
              </div>
            )}
          </div>
        )}

        {isHomeLoan && state.schedule && state.schedule.length > 0 && (
          <div className="mt-8 space-y-3 w-full">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-base font-bold text-beigeLight">📅 5년 상환 계획</h4>
              <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} className="bg-gray-700 text-white border border-brownBorder rounded-lg px-2 py-1 text-[10px]">
                {availableYears.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-brownBorder shadow-lg scrollbar-hide">
              <table className="w-full text-center text-[10px] border-collapse min-w-[400px]">
                <thead className="bg-[#2f2a25] text-gray-400">
                  <tr>
                    <th className="p-2 border-b border-gray-700">회차</th>
                    <th className="p-2 border-b border-gray-700">상환일</th>
                    <th className="p-2 border-b border-gray-700 text-beigeLight font-bold">원리금</th>
                    <th className="p-2 border-b border-gray-700">원금</th>
                    <th className="p-2 border-b border-gray-700">이자</th>
                    <th className="p-2 border-b border-gray-700">잔액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50 bg-[#3a312a]">
                  {filteredSchedule.map((row) => (
                    <tr key={row.idx} className="hover:bg-white/5 transition">
                      <td className="p-2 text-gray-500">{row.idx}</td>
                      <td className="p-2 text-gray-300 font-medium whitespace-nowrap">{row.date.slice(5)}</td>
                      <td className="p-2 font-bold text-beigeLight whitespace-nowrap">{row.total.toLocaleString()}</td>
                      <td className="p-2 text-white whitespace-nowrap">{row.principal.toLocaleString()}</td>
                      <td className="p-2 text-red-400 font-medium whitespace-nowrap">{row.interest.toLocaleString()}</td>
                      <td className="p-2 text-gray-400 font-mono text-[9px] whitespace-nowrap">{row.remain.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isHomeLoan && state.monthlyPayment > 0 && (
          <div className="mt-6 p-5 bg-green-900/10 rounded-2xl border border-green-900/30 text-left leading-relaxed w-full">
            <p className="text-gray-300 text-[11px]">{state.amount}원을 {state.period}개월 동안 {state.rate}% 상환 이용 시</p>
            <div className="mt-4 pt-4 border-t border-green-900/20 space-y-1">
              <p className="text-lg font-black">매월 이자 <span className="text-beigeLight">{state.monthlyPayment.toLocaleString()}원</span></p>
              <p className="text-lg font-black">만기 상환 <span className="text-beigeLight">{state.lastMonthPayment.toLocaleString()}원</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function LoanPage() {
  const initialLoanState: LoanState = { amount: "", startDate: "", repaymentDay: "", period: "", periodUnit: "month", rate: "", partialRepayments: [], method: "체증식", monthlyPayment: 0, lastMonthPayment: 0 };
  const [activeTab, setActiveTab] = useState<"dash" | "home" | "park" | "kim">("dash");
  const [homeLoan, setHomeLoan] = useState<LoanState>({ ...initialLoanState, method: "체증식" });
  const [creditLoanPark, setCreditLoanPark] = useState<LoanState>({ ...initialLoanState, method: "만기일시" });
  const [creditLoanKim, setCreditLoanKim] = useState<LoanState>({ ...initialLoanState, method: "만기일시" });

  useEffect(() => {
    const loanDocRef = doc(db, "loans", "loanStateV14");
    const loadData = async () => {
      const snap = await getDoc(loanDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.home) setHomeLoan(data.home);
        if (data.park) setCreditLoanPark(data.park);
        if (data.kim) setCreditLoanKim(data.kim);
      }
    };
    loadData();
  }, []);

  const saveLoanData = async (type: string, newState: LoanState) => {
    try {
      const loanDocRef = doc(db, "loans", "loanStateV14");
      await setDoc(loanDocRef, { [type]: newState }, { merge: true });
      if (type === "home") setHomeLoan(newState);
      else if (type === "park") setCreditLoanPark(newState);
      else if (type === "kim") setCreditLoanKim(newState);
      alert("✅ 저장 및 계산이 완료되었습니다.");
    } catch (e) { console.error(e); }
  };

  const handleCalculate = (type: string, targetState?: LoanState) => {
    let loan = targetState || (type === "home" ? homeLoan : (type === "park" ? creditLoanPark : creditLoanKim));
    const p = Number(loan.amount.replace(/,/g, ""));
    const n = Number(loan.period);
    const r = Number(loan.rate);
    if (!p || isNaN(r) || !n || !loan.startDate) return alert("필수 항목을 모두 입력하세요.");

    if (type === "home") {
      const schedule = generateHFSchedule60(p, r, loan.startDate, Number(loan.repaymentDay || 21), loan.partialRepayments);
      saveLoanData(type, { ...loan, schedule });
    } else {
      const monthly = Math.floor(p * (r / 100) / 12);
      saveLoanData(type, { ...loan, monthlyPayment: monthly, lastMonthPayment: p + monthly });
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#2f2a25] flex flex-col items-center p-4 sm:p-8 text-white transition-colors overflow-x-hidden">
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">🏦 대출 관리 시스템</h2>

          <div className="flex bg-[#3a312a] p-1 rounded-2xl mb-8 border border-brownBorder shadow-xl overflow-x-auto whitespace-nowrap scrollbar-hide gap-1">
            {["dash", "home", "park", "kim"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all ${activeTab === tab ? "bg-beigeLight text-darkText shadow-md" : "text-gray-400"}`}>
                {tab === "dash" ? "📊 대시보드" : (tab === "home" ? "🏠 집대출" : (tab === "park" ? "박재현" : "김용휘"))}
              </button>
            ))}
          </div>

          <div className="w-full">
            {activeTab === "dash" && <LoanDashboard home={homeLoan} park={creditLoanPark} kim={creditLoanKim} />}
            {activeTab === "home" && <LoanCalculator type="home" title="🏠 주택담보대출" state={homeLoan} onStateChange={setHomeLoan} onCalculate={(ts) => handleCalculate("home", ts)} onReset={() => setHomeLoan({ ...initialLoanState, method: "체증식" })} color="text-beigeLight" isHomeLoan={true} />}
            {activeTab === "park" && <LoanCalculator type="park" ownerName="박재현" title="💳 개인 신용대출" state={creditLoanPark} onStateChange={setCreditLoanPark} onCalculate={(ts) => handleCalculate("park", ts)} onReset={() => setCreditLoanPark({ ...initialLoanState, method: "만기일시" })} color="text-beigeLight" />}
            {activeTab === "kim" && <LoanCalculator type="kim" ownerName="김용휘" title="💳 개인 신용대출" state={creditLoanKim} onStateChange={setCreditLoanKim} onCalculate={(ts) => handleCalculate("kim", ts)} onReset={() => setCreditLoanKim({ ...initialLoanState, method: "만기일시" })} color="text-beigeLight" />}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        * { box-sizing: border-box; }
        input[type="date"] {
          min-width: 0;
          width: 100% !important;
          -webkit-appearance: none;
          appearance: none;
        }
      `}</style>
    </AuthGuard>
  );
}
