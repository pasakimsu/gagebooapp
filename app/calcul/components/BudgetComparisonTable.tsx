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
    <div className="mt-6 bg-[#2f2a25] text-white p-2 sm:p-4 rounded-lg w-full overflow-hidden">
      <h3 className="text-white text-base sm:text-lg font-semibold mb-3">사용자별 입력된 금액</h3>
      <div className="w-full mb-6">
        <table className="w-full text-white border-collapse border border-gray-600 table-fixed">
          <thead>
            <tr className="bg-[#3a312a]">
              <th className="border border-gray-600 p-1 sm:p-2 text-[10px] sm:text-sm w-[20%]">사용자</th>
              <th className="border border-gray-600 p-1 sm:p-2 text-[10px] sm:text-sm w-[26%]">5일 수당</th>
              <th className="border border-gray-600 p-1 sm:p-2 text-[10px] sm:text-sm w-[26%]">20일 월급</th>
              <th className="border border-gray-600 p-1 sm:p-2 text-[10px] sm:text-sm text-[#FFC90E] w-[28%]">합계</th>
            </tr>
          </thead>
          <tbody>
            {userBudgets.map((budget, index) => (
              <tr key={index} className="text-center">
                <td className={`border border-gray-600 p-1 sm:p-2 font-bold text-[10px] sm:text-sm truncate ${budget.userId === 'bak' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {budget.userId}
                </td>
                <td className="border border-gray-600 p-1 sm:p-2 text-[9px] sm:text-sm break-all">
                  {budget.allowance.toLocaleString()}<span className="text-[8px] sm:text-xs ml-0.5 text-gray-400">원</span>
                </td>
                <td className="border border-gray-600 p-1 sm:p-2 text-[9px] sm:text-sm break-all">
                  {budget.salary.toLocaleString()}<span className="text-[8px] sm:text-xs ml-0.5 text-gray-400">원</span>
                </td>
                <td className="border border-gray-600 p-1 sm:p-2 text-[10px] sm:text-sm font-bold text-[#FFC90E] break-all">
                  {budget.totalSalary.toLocaleString()}<span className="text-[8px] sm:text-xs ml-0.5 opacity-70">원</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-white text-base sm:text-lg font-semibold mb-3">사용자별 배분 결과</h3>
      <div className="w-full">
        <table className="w-full text-white border-collapse border border-gray-600 table-fixed">
          <thead>
            <tr className="bg-[#3a312a]">
              <th className="border border-gray-600 p-1 text-[9px] sm:text-xs w-[18%]">사용자</th>
              <th className="border border-gray-600 p-1 text-[9px] sm:text-xs text-blue-300 w-[20.5%]">생활비</th>
              <th className="border border-gray-600 p-1 text-[9px] sm:text-xs text-blue-300 w-[20.5%]">적금</th>
              <th className="border border-gray-600 p-1 text-[9px] sm:text-xs text-blue-300 w-[20.5%]">투자</th>
              <th className="border border-gray-600 p-1 text-[9px] sm:text-xs text-blue-300 w-[20.5%]">가족</th>
            </tr>
          </thead>
          <tbody>
            {userBudgets.map((budget, index) => (
              <tr key={index} className="text-center">
                <td className={`border border-gray-600 p-1 font-bold text-[10px] sm:text-sm truncate ${budget.userId === 'bak' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {budget.userId}
                </td>
                <td className="border border-gray-600 p-1 text-[9px] sm:text-xs break-all leading-tight">
                  {budget.생활비.toLocaleString()}<span className="text-[7px] opacity-50 ml-0.5">원</span>
                </td>
                <td className="border border-gray-600 p-1 text-[9px] sm:text-xs break-all leading-tight">
                  {budget.적금.toLocaleString()}<span className="text-[7px] opacity-50 ml-0.5">원</span>
                </td>
                <td className="border border-gray-600 p-1 text-[9px] sm:text-xs break-all leading-tight">
                  {budget.투자.toLocaleString()}<span className="text-[7px] opacity-50 ml-0.5">원</span>
                </td>
                <td className="border border-gray-600 p-1 text-[9px] sm:text-xs break-all leading-tight">
                  {budget.가족.toLocaleString()}<span className="text-[7px] opacity-50 ml-0.5">원</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
