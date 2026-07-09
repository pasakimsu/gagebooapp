// BudgetDateSelector.tsx
"use client";

interface BudgetDateSelectorProps {
  year: string;
  month: string;
  onYearChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onMonthChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function BudgetDateSelector({ year, month, onYearChange, onMonthChange }: BudgetDateSelectorProps) {
  const years = Array.from({ length: 11 }, (_, i) => (2025 + i).toString());

  return (
    <div className="flex gap-2 mb-3">
      <select
        className="p-2 bg-[#2f2a25] text-white border border-gray-600 rounded"
        value={year}
        onChange={onYearChange}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>

      <select className="p-2 bg-[#2f2a25] text-white border border-gray-600 rounded" value={month} onChange={onMonthChange}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m.toString().padStart(2, "0")}>
            {m}월
          </option>
        ))}
      </select>
    </div>
  );
}
