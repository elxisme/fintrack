import React from 'react';
import { format } from 'date-fns';
import { Transaction, Account, Category } from '../../lib/offline-storage';

interface StatementOfAccountPrintProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  dateRange: {
    start: Date;
    end: Date;
    label: string;
  };
  exchangeRate?: number | null;
}

export default function StatementOfAccountPrint({
  transactions,
  accounts,
  categories,
  dateRange,
  exchangeRate
}: StatementOfAccountPrintProps) {
  // Format currency helper
  const formatCurrency = (amount: number) => {
    if (exchangeRate) {
      const usdAmount = amount / exchangeRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(usdAmount);
    }
    return `₦${new Intl.NumberFormat('en-NG').format(amount)}`;
  };

  // Calculate total balance from all accounts
  const totalBalance = accounts.reduce((sum, account) => {
    return sum + account.current_balance;
  }, 0);

  // Calculate summaries
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          body * {
            visibility: hidden;
          }
          .print-modal-content, .print-modal-content * {
            visibility: visible;
          }
          .print-modal-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10px;
            background: white;
            font-size: 10pt;
            line-height: 1.2;
          }
          .print-modal-content table {
            font-size: 9pt;
            page-break-inside: auto;
            width: 100%;
            border-collapse: collapse;
          }
          .print-modal-content thead {
            display: table-header-group;
          }
          .print-modal-content tbody {
            display: table-row-group;
          }
          .print-modal-content tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .print-modal-content th, .print-modal-content td {
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="print-modal-content max-w-4xl mx-auto bg-white text-black">
        {/* Header */}
        <div className="text-center mb-4 border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold mb-1">CHURCH OF CHRIST, KAGINI</h1>
          <h2 className="text-lg font-semibold mb-2">STATEMENT OF ACCOUNT</h2>
          <div className="text-xs">
            <p><strong>Period:</strong> {dateRange.label}</p>
            <p><strong>Generated on:</strong> {format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="bg-blue-100 border-2 border-blue-400 p-4 text-center">
              <h3 className="text-lg font-bold text-blue-800">TOT. BALANCE: {formatCurrency(totalBalance)}</h3>
            </div>
          </div>
          <div>
            <div className={`text-center p-4 border-2 ${netIncome >= 0 ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
              <h3 className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                NET INCOME: {formatCurrency(netIncome)}
              </h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="bg-green-100 border-2 border-green-400 p-4 text-center">
              <h3 className="text-lg font-bold text-green-800">TOTAL INCOME: {formatCurrency(totalIncome)}</h3>
            </div>
          </div>
          <div>
            <div className="bg-red-100 border-2 border-red-400 p-4 text-center">
              <h3 className="text-lg font-bold text-red-800">TOTAL EXPENSES: {formatCurrency(totalExpenses)}</h3>
            </div>
          </div>
        </div>

        {/* Detailed Transactions */}
        <div>
          <h3 className="text-base font-bold mb-2 border-b border-gray-400">DETAILED TRANSACTIONS</h3>
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1 text-left font-semibold">Date</th>
                <th className="border border-gray-400 p-1 text-left font-semibold">Description</th>
                <th className="border border-gray-400 p-1 text-left font-semibold">Account</th>
                <th className="border border-gray-400 p-1 text-left font-semibold">Category</th>
                <th className="border border-gray-400 p-1 text-left font-semibold">Type</th>
                <th className="border border-gray-400 p-1 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction) => {
                const account = accounts.find(acc => acc.id === transaction.account_id);
                const category = categories.find(cat => cat.id === transaction.category_id);
                const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
                
                let description = transaction.description || 'Transaction';
                if (transaction.type === 'transfer') {
                  description = `Transfer: ${account?.name} → ${targetAccount?.name}`;
                }

                return (
                  <tr key={transaction.id}>
                    <td className={`border border-gray-400 p-1 ${transaction.type === 'income' ? 'border-l-4 border-l-green-500' : transaction.type === 'expense' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="border border-gray-400 p-1">{description}</td>
                    <td className="border border-gray-400 p-1">{account?.name || 'Unknown Account'}</td>
                    <td className="border border-gray-400 p-1">
                      {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                    </td>
                    <td className="border border-gray-400 p-1 capitalize">{transaction.type}</td>
                    <td className="border border-gray-400 p-1 text-right">
                      {transaction.type === 'expense' ? 
                        `-${formatCurrency(Math.abs(transaction.amount))}` : 
                        formatCurrency(Math.abs(transaction.amount))
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-gray-400 text-center text-xs text-gray-600">
          <p>Generated by ChurchTrack Financial Management System</p>
          <p>This is a computer-generated document and does not require a signature.</p>
        </div>

        {/* Print Button */}
        <div className="no-print mt-4 text-center">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Print Statement
          </button>
        </div>
      </div>
    </>
  );
}