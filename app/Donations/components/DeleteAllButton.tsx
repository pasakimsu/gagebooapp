"use client";

import { useState } from "react";
import { db, collection, getDocs, deleteDoc, doc } from "@/lib/firebase";

interface DeleteAllButtonProps {
  onAfterDelete?: () => void;
}

export default function DeleteAllButton({ onAfterDelete }: DeleteAllButtonProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAll = async () => {
    const confirmDelete = confirm("🚨 모든 부조금 데이터를 삭제하시겠습니까?");
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const userId = localStorage.getItem("userId") || "donations";
      const querySnapshot = await getDocs(collection(db, userId));

      if (querySnapshot.empty) {
        alert("📢 삭제할 데이터가 없습니다.");
        setDeleting(false);
        return;
      }

      for (const document of querySnapshot.docs) {
        await deleteDoc(doc(db, userId, document.id));
      }

      alert("✅ 모든 부조금 데이터가 삭제되었습니다!");
      onAfterDelete?.();
    } catch (error) {
      console.error("❌ 데이터 삭제 오류:", error);
      alert("❌ 데이터를 삭제하는 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDeleteAll}
      disabled={deleting}
      className={`w-full px-4 py-3 rounded-lg font-bold text-white shadow-md transition-all active:scale-95 ${
        deleting
          ? "bg-[#5c5249] cursor-not-allowed"
          : "bg-[#8d7864] hover:bg-[#a48d77]"
      }`}
    >
      {deleting ? "삭제 중..." : "🗑️ 전체 삭제"}
    </button>
  );
}
