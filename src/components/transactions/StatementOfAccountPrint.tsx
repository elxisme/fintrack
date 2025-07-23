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
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            font-size: 12px;
            background: white;
          }
          .page-break {
            page-break-after: always;
          }
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      <div className="print-container p-4 bg-white text-gray-800">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-xl font-bold mb-1">CHURCH OF CHRIST, KAGINI</h1>
          <h2 className="text-lg font-semibold mb-2 border-b border-gray-300 pb-2">STATEMENT OF ACCOUNT</h2>
          <div className="text-xs flex justify-center space-x-4">
            <p><strong>Period:</strong> {dateRange.label}</p>
            <p><strong>Generated:</strong> {format(new Date(), 'MMM dd, yyyy')}</p>
          </div>
        </header>

        {/* Key Metrics - Single Row */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
          <div className="bg-blue-50 p-2 border border-blue-200 rounded text-center">
            <div className="font-medium">Total Balance</div>
            <div className="font-bold">{formatCurrency(totalBalance)}</div>
          </div>
          <div className={`p-2 border rounded text-center ${netIncome >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="font-medium">Net Income</div>
            <div className="font-bold">{formatCurrency(netIncome)}</div>
          </div>
          <div className="bg-green-50 p-2 border border-green-200 rounded text-center">
            <div className="font-medium">Total Income</div>
            <div className="font-bold">{formatCurrency(totalIncome)}</div>
          </div>
          <div className="bg-red-50 p-2 border border-red-200 rounded text-center">
            <div className="font-medium">Total Expenses</div>
            <div className="font-bold">{formatCurrency(totalExpenses)}</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2 bg-gray-100 p-1 px-2">TRANSACTION DETAILS</h3>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1 text-left">Date</th>
                <th className="border border-gray-300 p-1 text-left">Description</th>
                <th className="border border-gray-300 p-1 text-left">Account</th>
                <th className="border border-gray-300 p-1 text-left">Type</th>
                <th className="border border-gray-300 p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction, index) => {
                const account = accounts.find(acc => acc.id === transaction.account_id);
                const category = categories.find(cat => cat.id === transaction.category_id);
                const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
                
                let description = transaction.description || 'Transaction';
                if (transaction.type === 'transfer') {
                  description = `Transfer: ${account?.name} → ${targetAccount?.name}`;
                }

                return (
                  <tr 
                    key={transaction.id} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="border border-gray-300 p-1">{format(new Date(transaction.date), 'MMM dd')}</td>
                    <td className="border border-gray-300 p-1">{description}</td>
                    <td className="border border-gray-300 p-1">{account?.name || '--'}</td>
                    <td className="border border-gray-300 p-1 capitalize">{transaction.type}</td>
                    <td className={`border border-gray-300 p-1 text-right ${
                      transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
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
        <footer className="text-xs text-center text-gray-500 mt-4 pt-2 border-t border-gray-300">
          <p>Generated by ChurchTrack Financial Management System</p>
          <p>Computer-generated document - No signature required</p>
        </footer>

        {/* Print Button (hidden when printing) */}
        <div className="no-print mt-4 text-center">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Print Statement
          </button>
        </div>
      </div>
    </>
  );
}