"use client";

import { useState } from "react";
import { db, collection, addDoc } from "@/lib/firebase";

interface ManualDonationInputProps {
  onAfterRegister?: () => void;
}

export default function ManualDonationInput({ onAfterRegister }: ManualDonationInputProps) {
  const [sentForm, setSentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    name: "",
    reason: "",
    amount: "",
  });

  const [receivedForm, setReceivedForm] = useState({
    date: new Date().toISOString().split('T')[0],
    name: "",
    reason: "",
    amount: "",
  });

  const handleTextChange = (type: "sent" | "received", e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const setter = type === "sent" ? setSentForm : setReceivedForm;

    if (name === "amount") {
      const numeric = value.replace(/[^\d]/g, "");
      const formatted = numeric ? Number(numeric).toLocaleString() : "";
      setter((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setter((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (type: "sent" | "received") => {
    const form = type === "sent" ? sentForm : receivedForm;
    if (!form.date || !form.name || !form.reason || !form.amount) {
      alert("모든 항목을 입력하세요.");
      return;
    }

    try {
      const userId = localStorage.getItem("userId") || "donations";
      const amountValue = Number(form.amount.replace(/,/g, ""));

      await addDoc(collection(db, userId), {
        date: form.date,
        name: form.name.trim(),
        nameKeywords: generateNameKeywords(form.name.trim()),
        reason: form.reason.trim(),
        amount: type === "received" ? amountValue : 0,
        sentAmount: type === "sent" ? amountValue : null,
        sentDate: type === "sent" ? form.date : null,
        type: type
      });

      alert(`✅ ${type === "sent" ? "출금(보낸)" : "입금(받은)"} 내역이 등록되었습니다!`);
      const resetForm = { date: new Date().toISOString().split('T')[0], name: "", reason: "", amount: "" };
      if (type === "sent") setSentForm(resetForm);
      else setReceivedForm(resetForm);
      onAfterRegister?.();
    } catch (error) {
      console.error(error);
      alert("❌ 등록 중 오류가 발생했습니다.");
    }
  };

  const generateNameKeywords = (name: string): string[] => {
    const keywords = new Set<string>();
    for (let i = 0; i < name.length; i++) {
      for (let j = i + 1; j <= name.length; j++) {
        keywords.add(name.substring(i, j));
      }
    }
    return Array.from(keywords);
  };

  // 이미지 스타일을 반영한 입력창 스타일
  const inputStyle = "w-full box-border p-2.5 rounded bg-[#3a3f4b] text-white border-none outline-none focus:ring-1 focus:ring-beigeLight text-sm placeholder-gray-400";
  // 이미지 스타일을 반영한 등록 버튼 스타일
  const submitBtnStyle = "w-full bg-[#8d7864] hover:bg-[#a48d77] text-white font-bold py-2.5 rounded transition active:scale-95 shadow-md text-sm mt-2";

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

        {/* 왼쪽: 내가 보낸 금액 (출금) */}
        <div className="bg-[#322c26] p-5 rounded-xl shadow-xl w-full box-border border border-white/5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            📝 내가 보낸 금액 (출금)
          </h3>
          <div className="space-y-2">
            <input name="date" type="date" value={sentForm.date} onChange={(e) => handleTextChange("sent", e)} className={inputStyle} />
            <input name="name" placeholder="이름" value={sentForm.name} onChange={(e) => handleTextChange("sent", e)} className={inputStyle} />
            <input name="reason" placeholder="사유" value={sentForm.reason} onChange={(e) => handleTextChange("sent", e)} className={inputStyle} />
            <input name="amount" placeholder="금액" value={sentForm.amount} inputMode="numeric" onChange={(e) => handleTextChange("sent", e)} className={inputStyle} />
            <button onClick={() => handleSubmit("sent")} className={submitBtnStyle}>➕ 등록</button>
          </div>
        </div>

        {/* 오른쪽: 내가 받은 금액 (입금) */}
        <div className="bg-[#322c26] p-5 rounded-xl shadow-xl w-full box-border border border-white/5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            📝 내가 받은 금액 (입금)
          </h3>
          <div className="space-y-2">
            <input name="date" type="date" value={receivedForm.date} onChange={(e) => handleTextChange("received", e)} className={inputStyle} />
            <input name="name" placeholder="이름" value={receivedForm.name} onChange={(e) => handleTextChange("received", e)} className={inputStyle} />
            <input name="reason" placeholder="사유" value={receivedForm.reason} onChange={(e) => handleTextChange("received", e)} className={inputStyle} />
            <input name="amount" placeholder="금액" value={receivedForm.amount} inputMode="numeric" onChange={(e) => handleTextChange("received", e)} className={inputStyle} />
            <button onClick={() => handleSubmit("received")} className={submitBtnStyle}>➕ 등록</button>
          </div>
        </div>

      </div>
    </div>
  );
}
