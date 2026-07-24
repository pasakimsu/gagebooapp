"use client";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

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
    <div className="mt-6 bg-[#2f2a25] text-white p-2 rounded-lg w-full overflow-hidden">
      <h3 className="text-white text-base font-semibold mb-3">사용자별 입력 금액</h3>
      <div className="w-full mb-6 border border-gray-700 rounded-lg overflow-hidden bg-[#241e1a]">
        <TransformWrapper
          initialScale={1}
          minScale={0.8}
          maxScale={3}
          centerOnInit={true}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%" }}
          >
            <table className="w-full text-white border-collapse table-fixed">
              <thead>
                <tr className="bg-[#3a312a]">
                  <th className="border-b border-r border-gray-700 p-0.5 text-[11px] w-[18%]">사용자</th>
                  <th className="border-b border-r border-gray-700 p-0.5 text-[11px] w-[27%]">5일 수당</th>
                  <th className="border-b border-r border-gray-700 p-0.5 text-[11px] w-[27%]">20일 월급</th>
                  <th className="border-b border-gray-700 p-0.5 text-[11px] text-[#FFC90E] w-[28%] font-bold">합계</th>
                </tr>
              </thead>
              <tbody>
                {userBudgets.map((budget, index) => (
                  <tr key={index} className="text-center">
                    <td className={`border-b border-r border-gray-700 p-0.5 font-bold text-[12px] truncate ${budget.userId === 'bak' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {budget.userId}
                    </td>
                    <td className="border-b border-r border-gray-700 p-0.5 text-[11px] tracking-tighter whitespace-nowrap">
                      {budget.allowance.toLocaleString()}<span className="text-[7px] ml-0.5 text-gray-500">원</span>
                    </td>
                    <td className="border-b border-r border-gray-700 p-0.5 text-[11px] tracking-tighter whitespace-nowrap">
                      {budget.salary.toLocaleString()}<span className="text-[7px] ml-0.5 text-gray-500">원</span>
                    </td>
                    <td className="border-b border-gray-700 p-0.5 text-[12px] font-bold text-[#FFC90E] tracking-tighter whitespace-nowrap">
                      {budget.totalSalary.toLocaleString()}<span className="text-[7px] ml-0.5 opacity-70">원</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TransformComponent>
        </TransformWrapper>
      </div>

      <h3 className="text-white text-base font-semibold mb-3">사용자별 배분 결과</h3>
      <div className="w-full border border-gray-700 rounded-lg overflow-hidden bg-[#241e1a]">
        <TransformWrapper
          initialScale={1}
          minScale={0.8}
          maxScale={3}
          centerOnInit={true}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%" }}
          >
            <table className="w-full text-white border-collapse table-fixed">
              <thead>
                <tr className="bg-[#3a312a]">
                  <th className="border-b border-r border-gray-700 p-0.5 text-[10px] w-[16%] font-normal">사용자</th>
                  <th className="border-b border-r border-gray-700 p-0.5 text-[10px] text-blue-300 w-[21%] font-normal">생활비</th>
                  <th className="border-b border-r border-gray-700 p-0.5 text-[10px] text-blue-300 w-[21%] font-normal">적금</th>
                  <th className="border-b border-r border-gray-700 p-0.5 text-[10px] text-blue-300 w-[21%] font-normal">투자</th>
                  <th className="border-b border-gray-700 p-0.5 text-[10px] text-blue-300 w-[21%] font-normal">가족</th>
                </tr>
              </thead>
              <tbody>
                {userBudgets.map((budget, index) => (
                  <tr key={index} className="text-center">
                    <td className={`border-b border-r border-gray-700 p-0.5 font-bold text-[12px] truncate ${budget.userId === 'bak' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {budget.userId}
                    </td>
                    <td className="border-b border-r border-gray-700 p-0.5 text-[11px] tracking-tighter whitespace-nowrap">
                      {budget.생활비.toLocaleString()}<span className="text-[7px] opacity-40 ml-0.5">원</span>
                    </td>
                    <td className="border-b border-r border-gray-700 p-0.5 text-[11px] tracking-tighter whitespace-nowrap">
                      {budget.적금.toLocaleString()}<span className="text-[7px] opacity-40 ml-0.5">원</span>
                    </td>
                    <td className="border-b border-r border-gray-700 p-0.5 text-[11px] tracking-tighter whitespace-nowrap">
                      {budget.투자.toLocaleString()}<span className="text-[7px] opacity-40 ml-0.5">원</span>
                    </td>
                    <td className="border-b border-gray-700 p-0.5 text-[11px] tracking-tighter whitespace-nowrap">
                      {budget.가족.toLocaleString()}<span className="text-[7px] opacity-40 ml-0.5">원</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TransformComponent>
        </TransformWrapper>
      </div>
      <p className="mt-2 text-center text-[10px] text-gray-500 italic">💡 표를 두 손가락으로 벌려 확대할 수 있습니다.</p>
    </div>
  );
}
