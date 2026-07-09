"use client";

interface BudgetHeaderProps {
  userId: string | null;
}

export default function BudgetHeader({ userId }: BudgetHeaderProps) {
  return (
    <div className="text-white text-center mb-4">
      {userId && <p className="text-lg font-semibold">{userId}님이 로그인했습니다.</p>}
    </div>
  );
}
