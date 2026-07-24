"use client";
interface Budget {
  userId: string;
  year: string;
  month: string;
  allowance: number;
  salary: number;
  totalSalary: number;
  생활비: number;
  적금: number;
  투자: number;
  가족: number;
}

export default function BudgetComparisonTable({ userBudgets }: { userBudgets: Budget[] }) {
  if (userBudgets.length === 0) return null;

  return (
    <div className="mt-6 bg-[#2f2a25] text-white p-4 rounded-lg w-full">
      <h3 className="text-white text-lg font-semibold mb-3">사용자별 입력된 금액</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-white border-collapse border border-gray-600 min-w-[300px]">
          <thead>
            <tr className="bg-[#3a312a]">
              <th className="border border-gray-600 p-2 text-sm">사용자</th>
              <th className="border border-gray-600 p-2 text-sm">5일 수당</th>
              <th className="border border-gray-600 p-2 text-sm">20일 월급</th>
              <th className="border border-gray-600 p-2 text-sm text-[#FFC90E]">합계</th>
            </tr>
          </thead>
          <tbody>
            {userBudgets.map((budget, index) => (
              <tr key={index} className="text-center">
                <td className={`border border-gray-600 p-2 font-bold ${budget.userId === 'bak' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {budget.userId}
                </td>
                <td className="border border-gray-600 p-2 text-sm">{budget.allowance.toLocaleString()}원</td>
                <td className="border border-gray-600 p-2 text-sm">{budget.salary.toLocaleString()}원</td>
                <td className="border border-gray-600 p-2 text-sm font-bold text-[#FFC90E]">{budget.totalSalary.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-white text-lg font-semibold mb-3">사용자별 배분 결과</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-white border-collapse border border-gray-600 min-w-[300px]">
          <thead>
            <tr className="bg-[#3a312a]">
              <th className="border border-gray-600 p-2 text-xs">사용자</th>
              <th className="border border-gray-600 p-2 text-xs text-blue-300">생활비</th>
              <th className="border border-gray-600 p-2 text-xs text-blue-300">적금</th>
              <th className="border border-gray-600 p-2 text-xs text-blue-300">투자</th>
              <th className="border border-gray-600 p-2 text-xs text-blue-300">가족</th>
            </tr>
          </thead>
          <tbody>
            {userBudgets.map((budget, index) => (
              <tr key={index} className="text-center">
                <td className={`border border-gray-600 p-2 font-bold text-sm ${budget.userId === 'bak' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {budget.userId}
                </td>
                <td className="border border-gray-600 p-2 text-xs">{budget.생활비.toLocaleString()}원</td>
                <td className="border border-gray-600 p-2 text-xs">{budget.적금.toLocaleString()}원</td>
                <td className="border border-gray-600 p-2 text-xs">{budget.투자.toLocaleString()}원</td>
                <td className="border border-gray-600 p-2 text-xs">{budget.가족.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
