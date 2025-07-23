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
  /* Reset and base styles */
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    font-size: 12pt !important;
    line-height: 1.4 !important;
  }
  
  /* Hide non-print elements */
  .no-print,
  .print-button,
  button {
    display: none !important;
  }
  
  /* Show only print content */
  body * {
    visibility: hidden;
  }
  
  .print-content,
  .print-content * {
    visibility: visible !important;
  }
  
  .print-content {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0.5in !important;
  }
  
  /* Page setup */
  @page {
    size: A4;
    margin: 0.5in;
  }
  
  /* Page break utilities */
  .page-break-before {
    page-break-before: always !important;
    break-before: page !important;
  }
  
  .page-break-after {
    page-break-after: always !important;
    break-after: page !important;
  }
  
  .page-break-avoid {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  .page-break-auto {
    page-break-inside: auto !important;
    break-inside: auto !important;
  }
  
  /* Header styles */
  .print-header {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-bottom: 30pt !important;
    text-align: center !important;
  }
  
  .print-header h1 {
    font-size: 18pt !important;
    font-weight: bold !important;
    margin: 0 0 10pt 0 !important;
  }
  
  .print-header h2 {
    font-size: 14pt !important;
    font-weight: bold !important;
    margin: 0 0 15pt 0 !important;
  }
  
  /* Summary section */
  .summary-grid {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-bottom: 20pt !important;
  }
  
  .summary-box {
    border: 2pt solid #000 !important;
    padding: 10pt !important;
    margin: 5pt !important;
    text-align: center !important;
    background: #f5f5f5 !important;
  }
  
  .summary-box h3 {
    font-size: 12pt !important;
    font-weight: bold !important;
    margin: 0 !important;
  }
  
  /* Table styles */
  .transactions-section {
    page-break-before: always !important;
    break-before: page !important;
  }
  
  .section-title {
    font-size: 14pt !important;
    font-weight: bold !important;
    background: #f0f0f0 !important;
    padding: 8pt !important;
    border: 1pt solid #000 !important;
    margin: 0 0 10pt 0 !important;
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  
  .transactions-table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 10pt !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
  }
  
  .transactions-table thead {
    display: table-header-group !important;
  }
  
  .transactions-table tbody {
    display: table-row-group !important;
  }
  
  .transactions-table th,
  .transactions-table td {
    border: 1pt solid #000 !important;
    padding: 4pt !important;
    text-align: left !important;
    vertical-align: top !important;
  }
  
  .transactions-table th {
    background: #e0e0e0 !important;
    font-weight: bold !important;
    font-size: 10pt !important;
  }
  
  .transactions-table tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  /* Prevent table from breaking badly */
  .transactions-table tbody tr:nth-child(20n) {
    page-break-after: always !important;
    break-after: page !important;
  }
  
  /* Amount column alignment */
  .amount-cell {
    text-align: right !important;
  }
  
  /* Transaction type styling */
  .income-row {
    background: #f0f8f0 !important;
  }
  
  .expense-row {
    background: #f8f0f0 !important;
  }
  
  /* Footer */
  .print-footer {
    page-break-before: always !important;
    break-before: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    text-align: center !important;
    font-size: 10pt !important;
    color: #666 !important;
    border-top: 1pt solid #000 !important;
    padding-top: 10pt !important;
    margin-top: 20pt !important;
  }
  
  /* Continuation indicators */
  .page-continuation {
    text-align: center !important;
    font-style: italic !important;
    margin: 10pt 0 !important;
    font-size: 10pt !important;
  }
  
  /* Prevent orphans and widows */
  p, div, li {
    orphans: 3 !important;
    widows: 3 !important;
  }
  
  /* Override any conflicting styles */
  .print-content * {
    max-width: none !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
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

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Total Current Balance */}
          <div>
            <div className="bg-blue-100 border-2 border-blue-400 p-6 text-center">
              <h3 className="text-xl font-bold text-blue-800 mb-2">TOT. BALANCE: {formatCurrency(totalBalance)}</h3>
              
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