"use client";

import {
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  db,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  deleteField,
} from "@/lib/firebase";

export interface SearchDonationsRef {
  refreshSearch: () => void;
}

interface DonationData {
  id: string;
  date: string;
  name: string;
  reason: string;
  amount: number;
  sentAmount?: number | null;
  sentDate?: string | null;
}

const getTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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

const DonationCard = ({
  item,
  listType,
  editingKey,
  editForm,
  onFormChange,
  onStartEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
}: any) => {
  const isEditing = editingKey?.id === item.id && editingKey?.listType === listType;
  const displayDate = listType === "sent" ? (item.sentDate || item.date) : item.date;

  if (isEditing) {
    return (
      <div className="bg-[#4a3f37] w-full p-4 rounded-xl border border-beigeLight/50 mb-3 space-y-2 text-left shadow-lg">
        <label className="text-[10px] text-gray-400 block px-1">날짜</label>
        <input name="date" type="date" value={editForm.date} onChange={onFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-sm border border-brownBorder outline-none" />
        <input name="name" type="text" value={editForm.name} onChange={onFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-sm border border-brownBorder outline-none" placeholder="이름" />
        <input name="reason" type="text" value={editForm.reason} onChange={onFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-sm border border-brownBorder outline-none" placeholder="사유" />
        <input name="amount" type="text" value={editForm.amount} onChange={onFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-sm border border-brownBorder outline-none" placeholder="금액" />
        <div className="flex gap-2 pt-1">
          <button onClick={() => onUpdate(item.id, listType)} className="flex-1 bg-blue-600 text-white py-2 rounded text-xs font-bold shadow-md">확인</button>
          <button onClick={onCancelEdit} className="flex-1 bg-gray-600 text-white py-2 rounded text-xs font-bold shadow-md">취소</button>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[#4a3f37] w-full p-4 rounded-xl border border-brownBorder/30 mb-3 shadow-sm text-left">
      <div className="space-y-1 mb-3">
        <p className="text-gray-400 font-medium text-[10px]">📅 {displayDate}</p>
        <p className="text-white font-bold text-sm">👤 {item.name}</p>
        <p className="text-gray-300 text-xs">📝 {item.reason}</p>
        <p className={`font-black text-sm ${listType === 'received' ? 'text-beigeLight' : 'text-[#86b5a7]'}`}>
          {listType === 'received' ? '📥' : '📤'} {(listType === 'received' ? item.amount : item.sentAmount || 0).toLocaleString()}원
        </p>
      </div>
      <div className="flex gap-2 border-t border-brownBorder/20 pt-3">
        <button onClick={() => onStartEdit(item, listType)} className="flex-1 py-1.5 rounded bg-gray-700/50 hover:bg-gray-600 text-white text-[10px] font-bold">수정</button>
        <button onClick={() => onDelete(item.id, listType)} className="flex-1 py-1.5 rounded bg-rose-900/30 hover:bg-rose-800 text-rose-200 text-[10px] font-bold transition">삭제</button>
      </div>
    </div>
  );
};

const SearchDonations = forwardRef<SearchDonationsRef>((_, ref) => {
  const [searchName, setSearchName] = useState<string>("");
  const [allFetchedRecords, setAllFetchedRecords] = useState<DonationData[]>([]);
  const [uniqueNames, setUniqueNames] = useState<string[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [editingKey, setEditingKey] = useState<{ id: string; listType: "received" | "sent" } | null>(null);
  const [addingType, setAddingType] = useState<"received" | "sent" | null>(null);
  const [form, setForm] = useState({ date: getTodayStr(), name: "", reason: "", amount: "" });

  const hasConsecutiveMatch = (search: string, target: string) => {
    const s = search.trim();
    const t = target.trim();

    if (s.includes(t) || t.includes(s)) return true;

    if (s.length >= 2) {
      for (let i = 0; i < s.length - 1; i++) {
        const chunk = s.substring(i, i + 2);
        if (t.includes(chunk)) return true;
      }
    }
    return false;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "amount") {
      const numeric = value.replace(/[^\d]/g, "");
      setForm(prev => ({ ...prev, amount: numeric ? Number(numeric).toLocaleString() : "" }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const refreshSearch = async (isAll = false) => {
    const term = searchName.trim();
    if (!isAll && term.length < 2) return alert("검색어는 2글자 이상 입력해주세요.");

    setLoading(true);
    setHasSearched(true);
    setSelectedPerson(null);
    setAddingType(null);
    setEditingKey(null);

    try {
      const userId = localStorage.getItem("userId") || "donations";

      const snapshot = await getDocs(collection(db, userId));
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<DonationData, "id">) }));

      let results: DonationData[] = [];
      if (isAll) {
        results = allData;
      } else {
        results = allData.filter(item => hasConsecutiveMatch(term, item.name));
      }

      setAllFetchedRecords(results);
      const names = Array.from(new Set(results.map(r => r.name))).sort();
      setUniqueNames(names);

      if (names.length === 1) setSelectedPerson(names[0]);

    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useImperativeHandle(ref, () => ({ refreshSearch: () => refreshSearch(false) }));

  const generateKeywords = (name: string): string[] => {
    const k = new Set<string>();
    for (let i = 0; i < name.length; i++) for (let j = i + 1; j <= name.length; j++) k.add(name.substring(i, j));
    return Array.from(k);
  };

  const handleAddNew = async () => {
    if (!form.date || !form.name || !form.reason || !form.amount) return alert("모든 항목을 입력하세요.");
    try {
      const userId = localStorage.getItem("userId") || "donations";
      const val = Number(form.amount.replace(/,/g, ""));
      await addDoc(collection(db, userId), {
        date: form.date,
        name: form.name.trim(),
        reason: form.reason.trim(),
        nameKeywords: generateKeywords(form.name.trim()),
        amount: addingType === "received" ? val : 0,
        sentAmount: addingType === "sent" ? val : null,
        sentDate: addingType === "sent" ? form.date : null,
        type: addingType
      });
      alert("✅ 등록되었습니다.");
      setAddingType(null);
      refreshSearch(false);
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (id: string, listType: "received" | "sent") => {
    try {
      const userId = localStorage.getItem("userId") || "donations";
      const val = Number(form.amount.replace(/,/g, ""));
      const docRef = doc(db, userId, id);
      const targetDoc = allFetchedRecords.find(r => r.id === id);

      if (targetDoc) {
        const hasBoth = (targetDoc.amount || 0) > 0 && (targetDoc.sentAmount || 0) > 0;

        if (hasBoth) {
          if (listType === "sent") {
            // 입금 내역은 기존 문서에 남겨두고(sentAmount 제거), 출금 내역을 새 문서로 분리
            await updateDoc(docRef, {
              sentAmount: deleteField(),
              sentDate: deleteField(),
            });
            await addDoc(collection(db, userId), {
              date: form.date,
              name: form.name.trim(),
              reason: form.reason.trim(),
              nameKeywords: generateKeywords(form.name.trim()),
              amount: 0,
              sentAmount: val,
              sentDate: form.date,
              type: "sent",
            });
          } else {
            // 출금 내역은 기존 문서에 남겨두고(amount 제거), 입금 내역을 새 문서로 분리
            await updateDoc(docRef, {
              amount: 0,
            });
            await addDoc(collection(db, userId), {
              date: form.date,
              name: form.name.trim(),
              reason: form.reason.trim(),
              nameKeywords: generateKeywords(form.name.trim()),
              amount: val,
              sentAmount: null,
              sentDate: null,
              type: "received",
            });
          }
        } else {
          // 단일 내역인 경우
          const data: any = {
            date: form.date,
            name: form.name.trim(),
            reason: form.reason.trim(),
            nameKeywords: generateKeywords(form.name.trim()),
          };
          if (listType === "received") {
            data.amount = val;
            data.sentAmount = deleteField();
            data.sentDate = deleteField();
          } else {
            data.sentAmount = val;
            data.sentDate = form.date;
            data.amount = 0;
          }
          await updateDoc(docRef, data);
        }
      }

      alert("✅ 수정되었습니다.");
      setEditingKey(null);
      refreshSearch(false);
    } catch (e) {
      console.error(e);
      alert("❌ 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string, listType: "received" | "sent") => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      const userId = localStorage.getItem("userId") || "donations";
      const targetDoc = allFetchedRecords.find(r => r.id === id);
      if (targetDoc) {
        const hasBoth = (targetDoc.amount || 0) > 0 && (targetDoc.sentAmount || 0) > 0;
        if (hasBoth) {
          const docRef = doc(db, userId, id);
          if (listType === "received") {
            await updateDoc(docRef, { amount: 0 });
          } else {
            await updateDoc(docRef, { sentAmount: deleteField(), sentDate: deleteField() });
          }
        } else {
          await deleteDoc(doc(db, userId, id));
        }
      }
      refreshSearch(false);
    } catch (e) {
      console.error(e);
      alert("❌ 삭제 중 오류가 발생했습니다.");
    }
  };

  const receivedResults = allFetchedRecords.filter(r => r.name === selectedPerson && (r.amount || 0) > 0);
  const sentResults = allFetchedRecords.filter(r => r.name === selectedPerson && (r.sentAmount || 0) > 0);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-md space-y-3 mb-10">
        <div className="flex gap-2">
          <input type="text" placeholder="이름으로 검색 (2글자 이상)" className="flex-1 p-3 border border-brownBorder rounded-2xl bg-gray-700 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-beigeLight" value={searchName} onChange={(e) => setSearchName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refreshSearch(false)} />
          <button onClick={() => refreshSearch(false)} className={`px-6 rounded-2xl font-black transition-all active:scale-95 shadow-lg ${searchName.length >= 2 ? "bg-beigeLight text-darkText" : "bg-gray-600 text-gray-400 cursor-not-allowed"}`} disabled={searchName.length < 2 || loading}>{loading ? "..." : "검색"}</button>
        </div>
        {typeof window !== "undefined" && localStorage.getItem("userId") === "admin" && (
          <button onClick={() => refreshSearch(true)} className="w-full py-3 bg-[#4F7A6E] text-white font-bold rounded-xl shadow-md text-sm">📂 전체 내역 불러오기 (admin)</button>
        )}
      </div>

      {hasSearched && !selectedPerson && uniqueNames.length > 0 && (
        <div className="w-full max-w-md bg-[#3a312a] p-5 rounded-2xl border border-brownBorder mb-10 text-left">
          <h3 className="text-beigeLight font-bold mb-4 text-sm">검색 결과에서 대상을 선택하세요:</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueNames.map(name => (
              <button key={name} onClick={() => setSelectedPerson(name)} className="bg-gray-700 hover:bg-beigeLight hover:text-darkText text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-brownBorder">👤 {name}</button>
            ))}
          </div>
        </div>
      )}

      {hasSearched && uniqueNames.length === 0 && (
        <div className="text-center py-10 space-y-4">
          <p className="text-gray-500">"{searchName}"님에 대한 내역이 없습니다.</p>
          <button onClick={() => { setSelectedPerson(searchName); setAddingType("received"); setForm({ ...form, name: searchName }); }} className="bg-beigeLight text-darkText px-6 py-2 rounded-xl font-bold shadow-md">✨ 신규 등록하기</button>
        </div>
      )}

      {selectedPerson && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-beigeLight font-black text-sm">📥 {selectedPerson} 입금 내역</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-beigeLight/10 text-beigeLight px-2 py-1 rounded-full font-bold">{receivedResults.length}건</span>
                <button onClick={() => { setAddingType("received"); setForm({ date: getTodayStr(), name: selectedPerson, reason: "", amount: "" }); }} className="bg-beigeLight text-darkText w-6 h-6 rounded-full font-black text-lg flex items-center justify-center shadow-md active:scale-90 transition">+</button>
              </div>
            </div>
            {addingType === "received" && (
              <div className="bg-[#322c26] p-4 rounded-xl border border-beigeLight/30 mb-4 space-y-2 text-left shadow-lg">
                <p className="text-[10px] font-bold text-beigeLight mb-1 uppercase tracking-wider">✨ 신규 입금 등록</p>
                <input name="date" type="date" value={form.date} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-xs border border-brownBorder" />
                <input name="name" type="text" value={form.name} readOnly className="w-full p-2 rounded bg-gray-900/50 text-gray-400 text-xs border border-brownBorder" />
                <input name="reason" type="text" value={form.reason} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-xs border border-brownBorder" placeholder="사유" />
                <input name="amount" type="text" value={form.amount} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-xs border border-brownBorder" placeholder="금액" />
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddNew} className="flex-1 bg-[#8d7864] text-white py-2 rounded text-xs font-bold shadow-md">등록</button>
                  <button onClick={() => setAddingType(null)} className="flex-1 bg-gray-600 text-white py-2 rounded text-xs font-bold shadow-md">취소</button>
                </div>
              </div>
            )}
            <div className="space-y-1">
              {receivedResults.map((item) => (
                <DonationCard
                  key={`${item.id}_received`}
                  item={item}
                  listType="received"
                  editingKey={editingKey}
                  editForm={form}
                  onFormChange={handleFormChange}
                  onStartEdit={(i: any) => {
                    setEditingKey({ id: i.id, listType: "received" });
                    setForm({ date: i.date || getTodayStr(), name: i.name, reason: i.reason, amount: (i.amount || 0).toLocaleString() });
                  }}
                  onUpdate={handleUpdate}
                  onDelete={(id: string) => handleDelete(id, "received")}
                  onCancelEdit={() => setEditingKey(null)}
                />
              ))}
              {receivedResults.length === 0 && !addingType && <p className="text-gray-500 text-center py-10 text-xs border border-dashed border-gray-700 rounded-xl">입금 내역이 없습니다.</p>}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[#86b5a7] font-black text-sm">📤 {selectedPerson} 출금 내역</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#4F7A6E]/20 text-[#86b5a7] px-2 py-1 rounded-full font-bold">{sentResults.length}건</span>
                <button onClick={() => { setAddingType("sent"); setForm({ date: getTodayStr(), name: selectedPerson, reason: "", amount: "" }); }} className="bg-[#4F7A6E] text-white w-6 h-6 rounded-full font-black text-lg flex items-center justify-center shadow-md active:scale-90 transition">+</button>
              </div>
            </div>
            {addingType === "sent" && (
              <div className="bg-[#322c26] p-4 rounded-xl border border-beigeLight/30 mb-4 space-y-2 text-left shadow-lg">
                <p className="text-[10px] font-bold text-beigeLight mb-1 uppercase tracking-wider">✨ 신규 출금 등록</p>
                <input name="date" type="date" value={form.date} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-xs border border-brownBorder" />
                <input name="name" type="text" value={form.name} readOnly className="w-full p-2 rounded bg-gray-900/50 text-gray-400 text-xs border border-brownBorder" />
                <input name="reason" type="text" value={form.reason} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-xs border border-brownBorder" placeholder="사유" />
                <input name="amount" type="text" value={form.amount} onChange={handleFormChange} className="w-full p-2 rounded bg-gray-800 text-white text-xs border border-brownBorder" placeholder="금액" />
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddNew} className="flex-1 bg-[#8d7864] text-white py-2 rounded text-xs font-bold shadow-md">등록</button>
                  <button onClick={() => setAddingType(null)} className="flex-1 bg-gray-600 text-white py-2 rounded text-xs font-bold shadow-md">취소</button>
                </div>
              </div>
            )}
            <div className="space-y-1">
              {sentResults.map((item) => (
                <DonationCard
                  key={`${item.id}_sent`}
                  item={item}
                  listType="sent"
                  editingKey={editingKey}
                  editForm={form}
                  onFormChange={handleFormChange}
                  onStartEdit={(i: any) => {
                    setEditingKey({ id: i.id, listType: "sent" });
                    setForm({ date: i.sentDate || i.date || getTodayStr(), name: i.name, reason: i.reason, amount: (i.sentAmount || 0).toLocaleString() });
                  }}
                  onUpdate={handleUpdate}
                  onDelete={(id: string) => handleDelete(id, "sent")}
                  onCancelEdit={() => setEditingKey(null)}
                />
              ))}
              {sentResults.length === 0 && !addingType && <p className="text-gray-500 text-center py-10 text-xs border border-dashed border-gray-700 rounded-xl">출금 내역이 없습니다.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchDonations;
SearchDonations.displayName = "SearchDonations";
