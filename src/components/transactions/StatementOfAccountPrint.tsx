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
          body {
            margin: 0;
            padding: 0;
            line-height: 1.2;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
            width: 100%;
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          .print-section {
            page-break-inside: avoid;
          }
          .print-header, .print-footer {
            position: fixed;
            width: 100%;
          }
          .print-header {
            top: 0;
          }
          .print-footer {
            bottom: 0;
          }
          .print-content {
            margin-top: 1.5cm;
            margin-bottom: 1.5cm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          tr {
            page-break-inside: avoid;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
          @page :first {
            margin-top: 2cm;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Header - appears on each page */}
        <header className="print-header bg-white p-2 border-b border-gray-300 text-center">
          <h1 className="text-lg font-bold">CHURCH OF CHRIST, KAGINI</h1>
          <h2 className="text-md font-semibold">STATEMENT OF ACCOUNT</h2>
          <div className="text-xs flex justify-center space-x-4">
            <p><strong>Period:</strong> {dateRange.label}</p>
            <p><strong>Generated:</strong> {format(new Date(), 'MMM dd, yyyy')}</p>
          </div>
        </header>

        {/* Main content area */}
        <div className="print-content">
          {/* Key Metrics */}
          <div className="print-section grid grid-cols-4 gap-2 mb-4 text-xs">
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
          <div className="print-section mb-4">
            <h3 className="text-sm font-bold mb-2 bg-gray-100 p-1 px-2">TRANSACTION DETAILS</h3>
            <table className="w-full">
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
                  const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
                  
                  let description = transaction.description || 'Transaction';
                  if (transaction.type === 'transfer') {
                    description = `Transfer: ${account?.name || '?'} → ${targetAccount?.name || '?'}`;
                  }

                  const rowColorClass = transaction.type === 'income' 
                    ? 'border-l-4 border-l-green-500' 
                    : transaction.type === 'expense' 
                      ? 'border-l-4 border-l-red-500' 
                      : 'border-l-4 border-l-blue-500';

                  return (
                    <tr 
                      key={transaction.id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${rowColorClass}`}
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
        </div>

        {/* Footer - appears on each page */}
        <footer className="print-footer bg-white p-2 border-t border-gray-300 text-xs text-center text-gray-500">
          <p>Generated by ChurchTrack Financial Management System</p>
          <p>Computer-generated document - No signature required</p>
        </footer>

        {/* Print Button (hidden when printing) */}
        <div className="no-print fixed bottom-4 right-4">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 shadow-lg"
          >
            Print Statement
          </button>
        </div>
      </div>
    </>
  );
}