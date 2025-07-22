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

  // Group income by category
  const incomeByCategory = categories
    .filter(cat => cat.type === 'income')
    .map(category => {
      const categoryTransactions = incomeTransactions.filter(t => t.category_id === category.id);
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { category: category.name, amount: total };
    })
    .filter(item => item.amount > 0);

  // Add uncategorized income
  const uncategorizedIncome = incomeTransactions
    .filter(t => !t.category_id)
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (uncategorizedIncome > 0) {
    incomeByCategory.push({ category: 'Uncategorized', amount: uncategorizedIncome });
  }

  // Group expenses by category
  const expenseByCategory = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = expenseTransactions.filter(t => t.category_id === category.id);
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { category: category.name, amount: total };
    })
    .filter(item => item.amount > 0);

  // Add uncategorized expenses
  const uncategorizedExpenses = expenseTransactions
    .filter(t => !t.category_id)
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (uncategorizedExpenses > 0) {
    expenseByCategory.push({ category: 'Uncategorized', amount: uncategorizedExpenses });
  }

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
          .print-modal-content, .print-modal-content * {
            visibility: visible;
          }
          .print-modal-content {
            /* Remove absolute positioning and fixed width/height to allow content to flow across pages */
            position: static; /* Change from absolute to static */
            width: auto; /* Allow width to adjust */
            margin: 0; /* Remove fixed margin */
            padding: 20px; /* Keep padding */
            background: white; /* Keep background */
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="print-modal-content max-w-4xl mx-auto p-8 bg-white text-black">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
          <h1 className="text-3xl font-bold mb-2">CHURCH OF CHRIST, KAGINI</h1>
          <h2 className="text-xl font-semibold mb-4">STATEMENT OF ACCOUNT</h2>
          <div className="text-sm">
            <p><strong>Period:</strong> {dateRange.label}</p>
            <p><strong>Generated on:</strong> {format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
        </div>

        {/* Total Balance and Net Income Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Total Balance */}
          <div>
            <div className="bg-blue-100 border-2 border-blue-400 p-6 text-center">
              <h3 className="text-xl font-bold text-blue-800 mb-2">TOT. BAL: {formatCurrency(totalBalance)}</h3>
            </div>
          </div>

          {/* Net Income */}
          <div>
            <div className={`text-center p-6 border-2 ${netIncome >= 0 ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
              <h3 className="text-xl font-bold">
                NET INCOME: {formatCurrency(netIncome)}
              </h3>
            </div>
          </div>
        </div>

        {/* Income and Expense Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Income Summary */}
          <div>
            <div className="bg-green-100 border-2 border-green-400 p-6 text-center">
              <h3 className="text-xl font-bold text-green-800 mb-2">TOTAL INCOME: {formatCurrency(totalIncome)}</h3>
            </div>
          </div>

          {/* Expense Summary */}
          <div>
            <div className="bg-red-100 border-2 border-red-400 p-6 text-center">
              <h3 className="text-xl font-bold text-red-800 mb-2">TOTAL EXPENSES: {formatCurrency(totalExpenses)}</h3>
            </div>
          </div>
        </div>

        {/* Detailed Transactions */}
        <div>
          <h3 className="text-lg font-bold mb-4 bg-blue-100 p-2 border border-gray-400">DETAILED TRANSACTIONS</h3>
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left font-semibold">Date</th>
                <th className="border border-gray-400 p-2 text-left font-semibold">Description</th>
                <th className="border border-gray-400 p-2 text-left font-semibold">Account</th>
                <th className="border border-gray-400 p-2 text-left font-semibold">Category</th>
                <th className="border border-gray-400 p-2 text-left font-semibold">Type</th>
                <th className="border border-gray-400 p-2 text-right font-semibold">Amount</th>
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
                  <tr key={transaction.id} className={transaction.type === 'income' ? 'bg-green-25' : transaction.type === 'expense' ? 'bg-red-25' : 'bg-blue-25'}>
                    <td className="border border-gray-400 p-2">{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                    <td className="border border-gray-400 p-2">{description}</td>
                    <td className="border border-gray-400 p-2">{account?.name || 'Unknown Account'}</td>
                    <td className="border border-gray-400 p-2">
                      {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                    </td>
                    <td className="border border-gray-400 p-2 capitalize">{transaction.type}</td>
                    <td className="border border-gray-400 p-2 text-right">
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
        <div className="mt-8 pt-4 border-t border-gray-400 text-center text-sm text-gray-600">
          <p>Generated by ChurchTrack Financial Management System</p>
          <p>This is a computer-generated document and does not require a signature.</p>
        </div>

        {/* Print Button (hidden when printing) */}
        <div className="no-print mt-8 text-center">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Print Statement
          </button>
        </div>
      </div>
    </>
  );
}

