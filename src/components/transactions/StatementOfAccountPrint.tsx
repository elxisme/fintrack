import React from "react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
}

interface StatementOfAccountProps {
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const StatementOfAccountPrint: React.FC<StatementOfAccountProps> = ({
  transactions,
  totalIncome,
  totalExpenses,
  balance,
}) => {
  return (
    <div className="print-area px-4 py-6 text-sm text-gray-800 font-sans">
      {/* Watermark */}
      <div className="watermark print-only">Church of Christ, Kagini</div>

      <div className="mb-4 text-center">
        <h1 className="text-xl font-semibold">Statement of Account</h1>
        <p>{format(new Date(), "MMMM dd, yyyy")}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-xs mb-6 text-center">
        <div className="bg-gray-100 p-2 rounded shadow">
          <div className="font-bold">Total Income</div>
          <div>₦{totalIncome.toLocaleString()}</div>
        </div>
        <div className="bg-gray-100 p-2 rounded shadow">
          <div className="font-bold">Total Expenses</div>
          <div>₦{totalExpenses.toLocaleString()}</div>
        </div>
        <div className="bg-gray-100 p-2 rounded shadow">
          <div className="font-bold">Total Bal</div>
          <div>₦{balance.toLocaleString()}</div>
        </div>
      </div>

      <table className="transactions-table w-full text-xs border-collapse">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Amount (₦)</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn, index) => (
            <React.Fragment key={txn.id}>
              <tr className="border-b">
                <td className="p-2 border">{format(new Date(txn.date), "dd/MM/yyyy")}</td>
                <td className="p-2 border">{txn.type}</td>
                <td className="p-2 border">{txn.description}</td>
                <td className="p-2 border text-right">
                  {txn.amount.toLocaleString()}
                </td>
              </tr>
              {(index + 1) % 25 === 0 && (
                <tr className="page-break-row">
                  <td colSpan={4}></td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <style jsx global>{`
        @media print {
          body {
            font-size: 12px;
            line-height: 1.6;
          }

          .page-break-row {
            page-break-after: always !important;
          }

          .transactions-table tbody tr,
          .transactions-table tbody td {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-only {
            display: block !important;
          }
        }

        .print-only {
          display: none;
        }

        .watermark {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3rem;
          color: #c5c5c5;
          opacity: 0.15;
          white-space: nowrap;
          z-index: 0;
          pointer-events: none;
          user-select: none;
        }

        .print-area {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default StatementOfAccountPrint;
