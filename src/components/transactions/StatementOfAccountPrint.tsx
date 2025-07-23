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
          body {
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: relative;
            width: 100%;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.3;
          }
          .page-header, .page-footer {
            position: fixed;
            left: 0;
            right: 0;
            background: white;
          }
          .page-header {
            top: 0;
            height: 4cm;
          }
          .page-footer {
            bottom: 0;
            height: 2cm;
            border-top: 1px solid #ccc;
          }
          .content {
            margin-top: 4cm;
            margin-bottom: 2cm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            page-break-inside: auto;
          }
          thead {
            display: table-header-group;
          }
          tbody {
            display: table-row-group;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            padding: 4px;
            border: 1px solid #ddd;
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .summary-grid {
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
        @page :first {
          .page-header {
            height: auto;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Fixed header that repeats on each page */}
        <div className="page-header p-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold mb-1 text-center">CHURCH OF CHRIST, KAGINI</h1>
          <h2 className="text-lg font-semibold mb-2 text-center">STATEMENT OF ACCOUNT</h2>
          <div className="text-sm flex justify-between">
            <p><strong>Period:</strong> {dateRange.label}</p>
            <p><strong>Generated on:</strong> {format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
        </div>

        {/* Main content area */}
        <div className="content p-4">
          {/* Summary Section */}
          <div className="summary-grid mb-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="bg-blue-100 border-2 border-blue-400 p-3 text-center">
                <h3 className="text-md font-bold text-blue-800">TOT. BALANCE: {formatCurrency(totalBalance)}</h3>
              </div>
              <div className={`text-center p-3 border-2 ${netIncome >= 0 ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
                <h3 className={`text-md font-bold ${netIncome >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  NET INCOME: {formatCurrency(netIncome)}
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-100 border-2 border-green-400 p-3 text-center">
                <h3 className="text-md font-bold text-green-800">TOTAL INCOME: {formatCurrency(totalIncome)}</h3>
              </div>
              <div className="bg-red-100 border-2 border-red-400 p-3 text-center">
                <h3 className="text-md font-bold text-red-800">TOTAL EXPENSES: {formatCurrency(totalExpenses)}</h3>
              </div>
            </div>
          </div>

          {/* Detailed Transactions */}
          <div>
            <h3 className="text-base font-bold mb-2 border-b border-gray-400">DETAILED TRANSACTIONS</h3>
            <table>
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left font-semibold">Date</th>
                  <th className="text-left font-semibold">Description</th>
                  <th className="text-left font-semibold">Account</th>
                  <th className="text-left font-semibold">Category</th>
                  <th className="text-left font-semibold">Type</th>
                  <th className="text-right font-semibold">Amount</th>
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
                      <td className={`${transaction.type === 'income' ? 'border-l-4 border-l-green-500' : transaction.type === 'expense' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </td>
                      <td>{description}</td>
                      <td>{account?.name || 'Unknown Account'}</td>
                      <td>
                        {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                      </td>
                      <td className="capitalize">{transaction.type}</td>
                      <td className="text-right">
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

        {/* Fixed footer that repeats on each page */}
        <div className="page-footer p-2 text-center text-sm text-gray-600">
          <p>Generated by ChurchTrack Financial Management System</p>
          <p>This is a computer-generated document and does not require a signature.</p>
        </div>

        {/* Print Button (only visible on screen) */}
        <div className="no-print fixed bottom-4 right-4">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            Print Statement
          </button>
        </div>
      </div>
    </>
  );
}