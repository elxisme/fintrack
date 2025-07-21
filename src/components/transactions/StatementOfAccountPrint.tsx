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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        @media print {
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
            padding: 20px;
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }

        .statement-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
        }

        .statement-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .header-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }

        .header-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
        }

        .summary-card {
          background: white;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .summary-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .income-card::before {
          background: linear-gradient(90deg, #10b981, #34d399);
        }

        .expense-card::before {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .net-income-card::before {
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
        }

        .net-income-negative::before {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }

        .transactions-table {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .table-header {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .transaction-row {
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .transaction-row:hover {
          background: rgba(99, 102, 241, 0.02);
        }

        .income-row {
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.02), rgba(52, 211, 153, 0.02));
        }

        .expense-row {
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.02), rgba(248, 113, 113, 0.02));
        }

        .transfer-row {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.02), rgba(96, 165, 250, 0.02));
        }

        .print-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          transform: translateY(0);
        }

        .print-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -10px rgba(102, 126, 234, 0.5);
        }

        .amount-positive {
          color: #059669;
          font-weight: 600;
        }

        .amount-negative {
          color: #dc2626;
          font-weight: 600;
        }

        .amount-neutral {
          color: #2563eb;
          font-weight: 600;
        }
      `}</style>

      <div className="statement-container">
        <div className="print-modal-content max-w-6xl mx-auto p-8">
          <div className="statement-card">
            {/* Header */}
            <div className="header-gradient text-white p-12 text-center relative">
              <div className="relative z-10">
                <h1 className="text-4xl font-bold mb-3 tracking-tight">CHURCH OF CHRIST, KAGINI</h1>
                <div className="w-24 h-1 bg-white/30 mx-auto mb-6 rounded-full"></div>
                <h2 className="text-2xl font-light mb-8 opacity-95">Statement of Account</h2>
                <div className="inline-flex items-center space-x-8 text-sm font-medium bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Period: {dateRange.label}</span>
                  </div>
                  <div className="w-px h-4 bg-white/30"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Generated: {format(new Date(), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-12">
              {/* Summary Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Income Summary */}
                <div className="summary-card income-card p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-3 uppercase tracking-wide">Total Income</h3>
                    <p className="text-4xl font-bold text-green-600 mb-2">{formatCurrency(totalIncome)}</p>
                    <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-green-600 mx-auto rounded-full"></div>
                  </div>
                </div>

                {/* Expense Summary */}
                <div className="summary-card expense-card p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-3 uppercase tracking-wide">Total Expenses</h3>
                    <p className="text-4xl font-bold text-red-600 mb-2">{formatCurrency(totalExpenses)}</p>
                    <div className="w-12 h-1 bg-gradient-to-r from-red-400 to-red-600 mx-auto rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Net Income */}
              <div className="mb-12">
                <div className={`summary-card p-8 ${netIncome >= 0 ? 'net-income-card' : 'net-income-negative'}`}>
                  <div className="text-center">
                    <div className={`w-20 h-20 ${netIncome >= 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-red-400 to-red-600'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-4 uppercase tracking-wide">Net Income</h3>
                    <p className={`text-5xl font-bold mb-3 ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(netIncome)}
                    </p>
                    <div className={`w-16 h-1 ${netIncome >= 0 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-red-400 to-red-600'} mx-auto rounded-full`}></div>
                  </div>
                </div>
              </div>

              {/* Detailed Transactions */}
              <div>
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Transaction Details</h3>
                    <p className="text-gray-500 font-medium">Complete record of all financial activities</p>
                  </div>
                </div>

                <div className="transactions-table">
                  <table className="w-full">
                    <thead>
                      <tr className="table-header">
                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-5 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
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

                        const rowClass = transaction.type === 'income' ? 'income-row' : 
                                        transaction.type === 'expense' ? 'expense-row' : 'transfer-row';

                        return (
                          <tr key={transaction.id} className={`transaction-row ${rowClass}`}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {format(new Date(transaction.date), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                              {description}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {account?.name || 'Unknown Account'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                transaction.type === 'transfer' ? 'bg-blue-100 text-blue-800' :
                                transaction.type === 'income' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                transaction.type === 'income' ? 'bg-green-100 text-green-800' :
                                transaction.type === 'expense' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-bold">
                              <span className={
                                transaction.type === 'expense' ? 'amount-negative' :
                                transaction.type === 'income' ? 'amount-positive' : 'amount-neutral'
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

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-gray-100 text-center">
                <div className="inline-flex items-center space-x-3 text-gray-500 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-700">ChurchTrack Financial Management System</p>
                    <p className="text-sm text-gray-500">Computer-generated document • No signature required</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print Button (hidden when printing) */}
          <div className="no-print mt-12 text-center">
            <button
              onClick={() => window.print()}
              className="print-button text-white px-10 py-4 font-semibold text-lg inline-flex items-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Statement</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}