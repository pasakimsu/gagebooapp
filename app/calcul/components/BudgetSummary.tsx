"use client";

interface BudgetSummaryProps {
  allocated: { [key: string]: number };
  accountNumbers: { [key: string]: string };
}

export default function BudgetSummary({ allocated, accountNumbers }: BudgetSummaryProps) {
  return (
    allocated.생활비 > 0 && (
      <div className="mt-4 p-4 bg-[#2f2a25] rounded-lg">
        <p>생활비: <strong>{allocated.생활비.toLocaleString()}원</strong> ({accountNumbers.생활비})</p>
        <p>적금: <strong>{allocated.적금.toLocaleString()}원</strong> ({accountNumbers.적금})</p>
        <p>투자: <strong>{allocated.투자.toLocaleString()}원</strong> ({accountNumbers.투자})</p>
        <p>가족: <strong>{allocated.가족.toLocaleString()}원</strong> ({accountNumbers.가족})</p>
      </div>
    )
  );
}
