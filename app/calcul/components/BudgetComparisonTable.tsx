"use client";
interface Budget {
  userId: string;
  year: string;
  month: string;
  생활비: number;
  적금: number;
  투자: number;
  가족: number;
}



export default function BudgetComparisonTable({ userBudgets }: { userBudgets: Budget[]  }) {
  if (userBudgets.length === 0) return null; // 데이터가 없으면 표시하지 않음

  return (
    <div className="mt-6 bg-[#2f2a25] text-white p-4 rounded-lg w-full">

      <h3 className="text-white text-lg font-semibold mb-3">사용자별 입력된 금액</h3>
      <table className="w-full text-white border-collapse border border-gray-600">
        <thead>
          <tr className="bg-[#2f2a25]">
            <th className="border border-gray-600 p-2">사용자</th>
            <th className="border border-gray-600 p-2">생활비</th>
            <th className="border border-gray-600 p-2">적금</th>
            <th className="border border-gray-600 p-2">투자</th>
            <th className="border border-gray-600 p-2">가족</th>
          </tr>
        </thead>
        <tbody>
          {userBudgets.map((budget, index) => (
            <tr key={index} className="text-center">
              <td className="border border-gray-600 p-2">{budget.userId}</td>
              <td className="border border-gray-600 p-2">{budget.생활비.toLocaleString()}원</td>
              <td className="border border-gray-600 p-2">{budget.적금.toLocaleString()}원</td>
              <td className="border border-gray-600 p-2">{budget.투자.toLocaleString()}원</td>
              <td className="border border-gray-600 p-2">{budget.가족.toLocaleString()}원</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
