"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { db, doc, onSnapshot, setDoc } from "@/lib/firebase";

interface ExpenseItem {
  id: string;
  name: string;
  amount: string;
  day: string;
}

interface ExpenseState {
  bak: ExpenseItem[];
  yong: ExpenseItem[];
}

interface LoanState {
  amount: string;
  startDate: string;
  repaymentDay: string;
  period: string;
  periodUnit: "month";
  rate: string;
  method: string;
  monthlyPayment: number;
  lastMonthPayment: number;
  schedule?: any[];
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

const ExpensesDashboard = ({ state, loans }: { state: ExpenseState, loans: { home: LoanState, park: LoanState, kim: LoanState } }) => {
  const getSum = (items: ExpenseItem[]) => items.reduce((sum, item) => sum + Number(item.amount.replace(/,/g, "")), 0);

  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;

  const bakSum = getSum(state.bak);
  const yongSum = getSum(state.yong);

  // 대출 항목들을 일반 고정지출 양식으로 변환
  const homeMonthly = loans.home.schedule?.find(s => s.year === curY && s.month === curM)?.total || 0;
  const isParkStarted = loans.park.startDate ? new Date() >= new Date(loans.park.startDate) : false;
  const isKimStarted = loans.kim.startDate ? new Date() >= new Date(loans.kim.startDate) : false;
  const parkMonthly = isParkStarted ? loans.park.monthlyPayment : 0;
  const kimMonthly = isKimStarted ? loans.kim.monthlyPayment : 0;

  const loanItems: ExpenseItem[] = [
    { id: "loan-home", name: "🏠 주택담보대출", amount: homeMonthly.toString(), day: loans.home.repaymentDay || "21" },
    { id: "loan-park", name: "💳 박재현 신용대출", amount: parkMonthly.toString(), day: loans.park.repaymentDay || "21" },
    { id: "loan-kim", name: "💳 김용휘 신용대출", amount: kimMonthly.toString(), day: loans.kim.repaymentDay || "21" }
  ].filter(item => Number(item.amount) > 0);

  const totalLoanMonthly = homeMonthly + parkMonthly + kimMonthly;
  const totalSum = bakSum + yongSum + totalLoanMonthly;

  const SummaryCard = ({ title, total, color, items, isLoan }: { title: string, total: number, color: string, items: ExpenseItem[], isLoan?: boolean }) => (
    <div className="bg-[#3a312a] p-5 rounded-2xl border border-brownBorder shadow-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className={`text-base font-bold ${color}`}>{title}</h4>
        <span className="text-lg font-black text-white">{total.toLocaleString()}원</span>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <p className="text-gray-500 text-[11px] text-center py-4 italic">내역이 없습니다.</p>
        ) : (
          [...items]
            .sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0))
            .map(item => (
              <div key={item.id} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-1">
                <span className="text-gray-400">
                  <span className="font-bold text-beigeLight w-6 inline-block">{item.day}일</span>
                  <span className="ml-1">{item.name}</span>
                </span>
                <span className={`${isLoan ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                  {Number(item.amount.replace(/,/g, "")).toLocaleString()}원
                </span>
              </div>
            ))
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div className="bg-gradient-to-br from-beigeLight to-[#a89273] p-6 rounded-3xl shadow-xl text-darkText text-center w-full">
        <p className="text-xs font-bold opacity-80 mb-1 uppercase tracking-widest">우리 집 총 지출 (고정+대출)</p>
        <h3 className="text-3xl font-black mb-1">{totalSum.toLocaleString()}원</h3>
        <p className="text-[11px] font-bold opacity-60">{numberToKorean(totalSum)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <SummaryCard title="👤 박재현 고정지출" total={bakSum} color="text-emerald-400" items={state.bak} />
        <SummaryCard title="👤 김용휘 고정지출" total={yongSum} color="text-red-400" items={state.yong} />
        <SummaryCard title="🏦 대출 상환 고정지출" total={totalLoanMonthly} color="text-beigeLight" items={loanItems} isLoan={true} />
      </div>
    </div>
  );
};

const ExpenseManager = ({ owner, items, onSave, loan }: { owner: "bak" | "yong", items: ExpenseItem[], onSave: (newItems: ExpenseItem[]) => void, loan: LoanState }) => {
  const [localItems, setLocalItems] = useState<ExpenseItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const colorClass = owner === "bak" ? "text-emerald-400" : "text-red-400";
  const btnColor = owner === "bak" ? "bg-emerald-600" : "bg-red-600";

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const isLoanActive = Number(loan.amount?.replace(/,/g, "")) > 0;
  const loanMonthly = isLoanActive ? loan.monthlyPayment : 0;

  const handleAdd = () => {
    const newItem: ExpenseItem = { id: Date.now().toString(), name: "", amount: "", day: "" };
    setLocalItems([...localItems, newItem]);
    setEditingId(newItem.id);
  };

  const handleUpdate = (id: string, field: keyof ExpenseItem, value: string) => {
    setLocalItems(localItems.map(item => item.id === id ? { ...item, [field]: field === "amount" ? formatNumber(value) : value } : item));
  };

  const handleIndividualSave = () => {
    onSave(localItems);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("정말로 이 지출 항목을 삭제하시겠습니까?")) {
      const newList = localItems.filter(item => item.id !== id);
      setLocalItems(newList);
      onSave(newList);
      setEditingId(null);
    }
  };

  const toggleEdit = (id: string) => {
    if (editingId === id) {
      setEditingId(null);
    } else {
      setEditingId(id);
    }
  };

  const sortedDisplayItems = [...localItems].sort((a, b) => {
    const dayA = Number(a.day) || 0;
    const dayB = Number(b.day) || 0;
    return dayA - dayB; // 오름차순
  });

  return (
    <div className="w-full bg-[#3a312a] p-4 sm:p-6 rounded-3xl border border-brownBorder shadow-2xl overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-bold ${colorClass}`}>{owner === "bak" ? "박재현" : "김용휘"}의 지출</h3>
        <button onClick={handleAdd} className={`${btnColor} text-white w-10 h-10 rounded-full font-black text-2xl shadow-lg active:scale-90 transition`}>+</button>
      </div>

      <div className="space-y-4">
        {/* 일반 고정지출 목록 */}
        {sortedDisplayItems.length === 0 && !isLoanActive ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-2xl text-gray-500 text-sm">
            오른쪽 위 + 버튼을 눌러<br/>고정지출을 추가하세요!
          </div>
        ) : (
          sortedDisplayItems.map((item) => (
            <div
              key={item.id}
              className={`bg-black/20 rounded-2xl border transition-all overflow-hidden ${
                editingId === item.id ? 'border-beigeLight ring-1 ring-beigeLight' : 'border-gray-700 active:bg-white/5'
              }`}
            >
              {editingId === item.id ? (
                <div className="p-5 cursor-pointer" onClick={() => setEditingId(null)}>
                  <div className="space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] text-gray-500 font-bold block mb-1">결제일</label>
                        <input
                          type="number"
                          value={item.day}
                          onChange={(e) => handleUpdate(item.id, "day", e.target.value)}
                          className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 text-center text-base outline-none focus:ring-1 focus:ring-beigeLight"
                          placeholder="일"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-500 font-bold block mb-1">항목명</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdate(item.id, "name", e.target.value)}
                          className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 text-base outline-none focus:ring-1 focus:ring-beigeLight"
                          placeholder="지출 항목명"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1 text-right">금액 (원)</label>
                      <input
                        type="text"
                        value={item.amount}
                        inputMode="numeric"
                        onChange={(e) => handleUpdate(item.id, "amount", e.target.value)}
                        className="w-full p-4 rounded-xl bg-gray-800 text-white border border-gray-600 text-right text-xl font-black outline-none focus:ring-1 focus:ring-beigeLight"
                        placeholder="금액 입력"
                      />
                      <p className="text-[11px] text-right text-beigeLight/80 font-bold mt-1">{numberToKorean(Number(item.amount.replace(/,/g, "")) || 0)}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 bg-gray-700 text-rose-400 font-bold py-4 rounded-2xl active:scale-95 transition shadow-lg border border-rose-900/30"
                      >
                        삭제하기
                      </button>
                      <button
                        onClick={handleIndividualSave}
                        className="flex-[2] bg-beigeLight text-darkText font-black py-4 rounded-2xl active:scale-95 transition shadow-lg text-lg"
                      >
                        저장하기
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => toggleEdit(item.id)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold">{item.day}일 결제</span>
                    <span className="text-white font-bold text-base">{item.name || "제목 없음"}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${colorClass}`}>
                      {item.amount ? Number(item.amount.replace(/,/g, "")).toLocaleString() : "0"}원
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium bg-black/30 px-2 py-0.5 rounded italic">상세보기/수정</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* 대출 상환 항목 (고정지출 양식과 동일한 디자인, 수정 불가) */}
        {isLoanActive && (
          <div className="bg-black/20 rounded-2xl border border-yellow-600/50 overflow-hidden shadow-inner">
            <div className="p-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-yellow-500 font-bold">{loan.repaymentDay || "21"}일 상환</span>
                <span className="text-white font-bold text-base">{owner === "bak" ? "박재현" : "김용휘"} 신용대출</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-yellow-400">{loanMonthly.toLocaleString()}원</p>
                <span className="text-[9px] text-gray-500 bg-yellow-950/30 px-2 py-0.5 rounded italic border border-yellow-900/10">대출관리시스템 연동됨</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-600 font-medium italic">지출 항목을 터치하면 수정하거나 삭제할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<"dash" | "bak" | "yong">("dash");
  const [state, setState] = useState<ExpenseState>({ bak: [], yong: [] });

  const initialLoanState: LoanState = { amount: "", startDate: "", repaymentDay: "", period: "", periodUnit: "month", rate: "", method: "", monthlyPayment: 0, lastMonthPayment: 0 };
  const [loans, setLoans] = useState({
    home: { ...initialLoanState },
    park: { ...initialLoanState },
    kim: { ...initialLoanState }
  });

  useEffect(() => {
    // 1. 고정지출 데이터 구독
    const docRef = doc(db, "settings", "fixedExpensesV1");
    const unsubscribeExpenses = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setState(snap.data() as ExpenseState);
      }
    });

    // 2. 대출 데이터 구독 (실시간)
    const loanDocRef = doc(db, "loans", "loanStateV14");
    const unsubscribeLoans = onSnapshot(loanDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLoans({
          home: data.home || initialLoanState,
          park: data.park || initialLoanState,
          kim: data.kim || initialLoanState
        });
      }
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeLoans();
    };
  }, []);

  const handleSave = async (owner: "bak" | "yong", newItems: ExpenseItem[]) => {
    try {
      const docRef = doc(db, "settings", "fixedExpensesV1");
      await setDoc(docRef, { ...state, [owner]: newItems }, { merge: true });
      alert("✅ 성공적으로 저장되었습니다!");
    } catch (e) {
      console.error(e);
      alert("❌ 저장에 실패했습니다.");
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#2f2a25] flex flex-col items-center p-4 sm:p-8 text-white transition-colors overflow-x-hidden">
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">💰 고정지출 관리</h2>

          <div className="flex bg-[#3a312a] p-1 rounded-2xl mb-8 border border-brownBorder shadow-xl gap-1">
            {["dash", "bak", "yong"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 px-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab ? "bg-beigeLight text-darkText shadow-md" : "text-gray-400"
                }`}
              >
                {tab === "dash" ? "📊 대시보드" : (tab === "bak" ? "👤 박재현" : "👤 김용휘")}
              </button>
            ))}
          </div>

          <div className="w-full animate-in fade-in duration-500">
            {activeTab === "dash" && <ExpensesDashboard state={state} loans={loans} />}
            {activeTab === "bak" && <ExpenseManager owner="bak" items={state.bak} onSave={(items) => handleSave("bak", items)} loan={loans.park} />}
            {activeTab === "yong" && <ExpenseManager owner="yong" items={state.yong} onSave={(items) => handleSave("yong", items)} loan={loans.kim} />}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #555; border-radius: 10px; }
        * { box-sizing: border-box; }
      `}</style>
    </AuthGuard>
  );
}
