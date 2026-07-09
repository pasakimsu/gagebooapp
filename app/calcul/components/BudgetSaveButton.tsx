"use client";

interface BudgetSaveButtonProps {
  onSave: () => void;
  onCalculate: () => void; // 새롭게 추가된 prop
}

export default function BudgetSaveButton({
  onSave,
  onCalculate,
}: BudgetSaveButtonProps) {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <button
        onClick={onCalculate}
        className="w-full px-4 py-3 rounded-lg shadow-md bg-[#8d7864] hover:bg-[#a48d77] text-white font-semibold transition-colors duration-300"
      >
        계산하기
      </button>
  
      <button
        onClick={onSave}
        className="w-full px-4 py-3 rounded-lg shadow-md bg-[#8d7864] hover:bg-[#a48d77] text-white font-semibold transition-colors duration-300"
      >
        저장하기
      </button>
    </div>
  );
  
 
}
