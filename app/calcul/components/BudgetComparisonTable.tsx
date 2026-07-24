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
    <div className="mt-6 bg-[#2f2a25] text-white p-2 rounded-lg w-full">
      <h3 className="text-white text-base font-semibold mb-3">사용자별 입력 금액</h3>
      <div className="w-full mb-6 border border-gray-700 rounded-lg overflow-hidden bg-[#241e1a]">
        <table className="w-full text-white border-collapse table-fixed">
          <thead>
            <tr className="bg-[#3a312a]">
              <th className="border-b border-r border-gray-700 p-1 text-[11px] w-[18%]">사용자</th>
              <th className="border-b border-r border-gray-700 p-1 text-[11px] w-[27%]">5일 수당</th>
              <th className="border-b border-r border-gray-700 p-1 text-[11px] w-[27%]">20일 월급</th>
              <th className="border-b border-gray-700 p-1 text-[11px] text-[#FFC90E] w-[28%] font-bold">합계</th>
            </tr>
          </thead>
          <tbody>
            {userBudgets.map((budget, index) => (
              <tr key={index} className="text-center">
                <td className={`border-b border-r border-gray-700 p-1 font-bold text-[12px] truncate ${budget.userId === 'bak' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {budget.userId}
                </td>
                <td className="border-b border-r border-gray-700 p-1 text-[11px] tracking-tighter whitespace-nowrap">
                  {budget.allowance.toLocaleString()}<span className="text-[7px] ml-0.5 text-gray-500">원</span>
                </td>
                <td className="border-b border-r border-gray-700 p-1 text-[11px] tracking-tighter whitespace-nowrap">
                  {budget.salary.toLocaleString()}<span className="text-[7px] ml-0.5 text-gray-500">원</span>
                </td>
                <td className="border-b border-gray-700 p-1 text-[12px] font-bold text-[#FFC90E] tracking-tighter whitespace-nowrap">
                  {budget.totalSalary.toLocaleString()}<span className="text-[7px] ml-0.5 opacity-70">원</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-white text-base font-semibold mb-3">사용자별 배분 결과</h3>
      <div className="w-full border border-gray-700 rounded-lg overflow-hidden bg-[#241e1a]">
        <table className="w-full text-white border-collapse table-fixed">
          <thead>
            <tr className="bg-[#3a312a]">
              <th className="border-b border-r border-gray-700 p-1 text-[10px] w-[16%] font-normal">사용자</th>
              <th className="border-b border-r border-gray-700 p-1 text-[10px] text-blue-300 w-[21%] font-normal">생활비</th>
              <th className="border-b border-r border-gray-700 p-1 text-[10px] text-blue-300 w-[21%] font-normal">적금</th>
              <th className="border-b border-r border-gray-700 p-1 text-[10px] text-blue-300 w-[21%] font-normal">투자</th>
              <th className="border-b border-gray-700 p-1 text-[10px] text-blue-300 w-[21%] font-normal">가족</th>
            </tr>
          </thead>
          <tbody>
            {userBudgets.map((budget, index) => (
              <tr key={index} className="text-center">
                <td className={`border-b border-r border-gray-700 p-1 font-bold text-[12px] truncate ${budget.userId === 'bak' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {budget.userId}
                </td>
                <td className="border-b border-r border-gray-700 p-1 text-[11px] tracking-tighter whitespace-nowrap">
                  {budget.생활비.toLocaleString()}<span className="text-[7px] opacity-40 ml-0.5">원</span>
                </td>
                <td className="border-b border-r border-gray-700 p-1 text-[11px] tracking-tighter whitespace-nowrap">
                  {budget.적금.toLocaleString()}<span className="text-[7px] opacity-40 ml-0.5">원</span>
                </td>
                <td className="border-b border-r border-gray-700 p-1 text-[11px] tracking-tighter whitespace-nowrap">
                  {budget.투자.toLocaleString()}<span className="text-[7px] opacity-40 ml-0.5">원</span>
                </td>
                <td className="border-b border-gray-700 p-1 text-[11px] tracking-tighter whitespace-nowrap">
                  {budget.가족.toLocaleString()}<span className="text-[7px] opacity-40 ml-0.5">원</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
