"use client";

interface BudgetInputProps {
  allowance: string;
  salary: string;
  onAllowanceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSalaryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BudgetInput({ allowance, salary, onAllowanceChange, onSalaryChange }: BudgetInputProps) {
  return (
    <div>
      <label className="text-white text-sm">5일 수당</label>
      <input
        type="text"
        placeholder="5일 수당을 입력하세요"
        className="w-full p-3 mb-3 border bg-[#2f2a25] rounded bg-[#2f2a25] text-white placeholder-gray-400"
        value={allowance}
        onChange={onAllowanceChange}
      />

      <label className="text-white text-sm">20일 월급</label>
      <input
        type="text"
        placeholder="20일 월급을 입력하세요"
        className="w-full p-3 mb-3 border bg-[#2f2a25] rounded bg-[#2f2a25] text-white placeholder-gray-400"
        value={salary}
        onChange={onSalaryChange}
      />
    </div>
  );
}
