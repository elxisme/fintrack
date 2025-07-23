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
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @page {
            margin: 0.75in;
            size: A4;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-content, .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
          
          .print-header {
            position: running(header);
          }
          
          .summary-grid {
            display: flex !important;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 24px;
          }
          
          .summary-card {
            flex: 1;
            min-width: 200px;
            page-break-inside: avoid;
          }
          
          .transaction-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          
          .transaction-row {
            page-break-inside: avoid;
          }
          
          .transaction-row.income {
            border-left: 4px solid #10b981 !important;
          }
          
          .transaction-row.expense {
            border-left: 4px solid #ef4444 !important;
          }
          
          .transaction-row.transfer {
            border-left: 4px solid #3b82f6 !important;
          }
        }
        
        @media screen {
          .print-content {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            min-height: 11in;
          }
        }
      `}</style>

      <div className="print-content">
        {/* Elegant Header with Gradient Background */}
        <div className="avoid-break mb-12">
          <div className="text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-lg opacity-60"></div>
            <div className="relative py-8 px-6">
              <h1 className="text-4xl font-light tracking-wide text-gray-800 mb-2">
                CHURCH OF CHRIST, KAGINI
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mb-4 rounded-full"></div>
              <h2 className="text-2xl font-extralight text-gray-600 mb-6 tracking-wider">
                Statement of Account
              </h2>
              <div className="text-sm text-gray-500 space-y-1">
                <p className="font-medium">{dateRange.label}</p>
                <p>Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Summary Cards */}
        <div className="summary-grid avoid-break mb-12">
          {/* Total Balance - Hero Card */}
          <div className="summary-card">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="text-center">
                <p className="text-blue-100 text-sm font-light mb-2 tracking-wide">TOTAL BALANCE</p>
                <p className="text-3xl font-light tracking-tight">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className="summary-card">
            <div className={`p-8 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300 ${
              netIncome >= 0 
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white' 
                : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
            }`}>
              <div className="text-center">
                <p className="text-white/80 text-sm font-light mb-2 tracking-wide">NET INCOME</p>
                <p className="text-3xl font-light tracking-tight">{formatCurrency(netIncome)}</p>
              </div>
            </div>
          </div>

          {/* Income */}
          <div className="summary-card">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-center">
                <p className="text-green-100 text-sm font-light mb-2 tracking-wide">TOTAL INCOME</p>
                <p className="text-2xl font-light tracking-tight">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="summary-card">
            <div className="bg-gradient-to-br from-red-400 to-red-500 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-center">
                <p className="text-red-100 text-sm font-light mb-2 tracking-wide">TOTAL EXPENSES</p>
                <p className="text-2xl font-light tracking-tight">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Transaction Table */}
        <div className="avoid-break">
          <div className="mb-6">
            <h3 className="text-2xl font-light text-gray-700 mb-2 tracking-wide">Transaction Details</h3>
            <div className="w-16 h-0.5 bg-gradient-to-r from-gray-400 to-transparent"></div>
          </div>
          
          <div className="overflow-hidden rounded-xl shadow-lg border border-gray-100">
            <table className="transaction-table w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="text-left py-4 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Description</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Account</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left py-4 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Type</th>
                  <th className="text-right py-4 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedTransactions.map((transaction, index) => {
                  const account = accounts.find(acc => acc.id === transaction.account_id);
                  const category = categories.find(cat => cat.id === transaction.category_id);
                  const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
                  
                  let description = transaction.description || 'Transaction';
                  if (transaction.type === 'transfer') {
                    description = `Transfer: ${account?.name} → ${targetAccount?.name}`;
                  }

                  const rowClass = `transaction-row ${transaction.type}`;
                  const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

                  return (
                    <tr key={transaction.id} className={`${rowClass} ${bgClass} hover:bg-gray-50 transition-colors duration-200`}>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800 font-medium">
                        {description}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {account?.name || 'Unknown Account'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.type === 'expense' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium">
                        <span className={
                          transaction.type === 'expense' 
                            ? 'text-red-600' 
                            : transaction.type === 'income' 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                        }>
                          {transaction.type === 'expense' ? 
                            `-${formatCurrency(Math.abs(transaction.amount))}` : 
                            formatCurrency(Math.abs(transaction.amount))
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Elegant Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 font-light">
              Generated by ChurchTrack Financial Management System
            </p>
            <p className="text-xs text-gray-400">
              This is a computer-generated document and does not require a signature.
            </p>
            <div className="flex justify-center mt-4">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Print Button */}
        <div className="no-print mt-12 text-center">
          <button
            onClick={() => window.print()}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Statement
          </button>
        </div>
      </div>
    </>
  );
}

