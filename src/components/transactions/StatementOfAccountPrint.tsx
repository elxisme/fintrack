import React from 'react';
import { format } from 'date-fns';

// Mock data for demonstration
const mockTransactions = [
  { id: 1, date: '2024-01-15', description: 'Sunday Offering', account_id: 1, category_id: 1, type: 'income', amount: 50000 },
  { id: 2, date: '2024-01-16', description: 'Electricity Bill', account_id: 1, category_id: 2, type: 'expense', amount: 15000 },
  { id: 3, date: '2024-01-17', description: 'Tithe Collection', account_id: 1, category_id: 1, type: 'income', amount: 75000 },
  { id: 4, date: '2024-01-18', description: 'Water Bill', account_id: 1, category_id: 3, type: 'expense', amount: 8000 },
  { id: 5, date: '2024-01-19', description: 'Building Fund', account_id: 1, category_id: 4, type: 'income', amount: 100000 },
  { id: 6, date: '2024-01-20', description: 'Sound System Repair', account_id: 1, category_id: 5, type: 'expense', amount: 25000 },
];

const mockAccounts = [
  { id: 1, name: 'Main Account', current_balance: 180000 }
];

const mockCategories = [
  { id: 1, name: 'Offerings', type: 'income' },
  { id: 2, name: 'Utilities', type: 'expense' },
  { id: 3, name: 'Water', type: 'expense' },
  { id: 4, name: 'Building Fund', type: 'income' },
  { id: 5, name: 'Equipment', type: 'expense' }
];

const mockDateRange = {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  label: 'January 2024'
};

export default function StatementOfAccountPrint({
  transactions = mockTransactions,
  accounts = mockAccounts,
  categories = mockCategories,
  dateRange = mockDateRange,
  exchangeRate = null
}) {
  // Format currency helper
  const formatCurrency = (amount) => {
    if (exchangeRate) {
      const usdAmount = amount / exchangeRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(usdAmount);
    }
    return `₦${new Intl.NumberFormat('en-NG').format(amount)}`;
  };

  // Calculate totals
  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
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
          
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          .print-header {
            page-break-after: avoid;
          }
          
          .print-summary {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          .transaction-row {
            page-break-inside: avoid;
          }
          
          .print-button {
            display: none !important;
          }
          
          table {
            border-collapse: collapse !important;
          }
          
          th, td {
            border: 1px solid #000 !important;
            padding: 4px !important;
            font-size: 11px !important;
          }
          
          .header-title {
            font-size: 18px !important;
            font-weight: bold !important;
          }
          
          .summary-box {
            border: 2px solid #000 !important;
            background-color: #f5f5f5 !important;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            padding: 20mm;
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      <div className="print-container">
        {/* Header Section */}
        <div className="print-header text-center mb-8 pb-4 border-b-2 border-black">
          <h1 className="header-title text-2xl font-bold mb-2">CHURCH OF CHRIST, KAGINI</h1>
          <h2 className="text-lg font-semibold mb-3">STATEMENT OF ACCOUNT</h2>
          <div className="text-sm space-y-1">
            <p><strong>Period:</strong> {dateRange.label}</p>
            <p><strong>Generated:</strong> {format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="print-summary mb-8">
          <h3 className="text-base font-bold mb-4 text-center">FINANCIAL SUMMARY</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="summary-box p-4 text-center border-2 border-black bg-gray-100">
              <div className="text-sm font-semibold mb-1">CURRENT BALANCE</div>
              <div className="text-lg font-bold">{formatCurrency(totalBalance)}</div>
            </div>
            <div className={`summary-box p-4 text-center border-2 border-black ${netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-sm font-semibold mb-1">NET INCOME</div>
              <div className="text-lg font-bold">{formatCurrency(netIncome)}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="summary-box p-4 text-center border-2 border-black bg-green-50">
              <div className="text-sm font-semibold mb-1">TOTAL INCOME</div>
              <div className="text-base font-bold">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="summary-box p-4 text-center border-2 border-black bg-red-50">
              <div className="text-sm font-semibold mb-1">TOTAL EXPENSES</div>
              <div className="text-base font-bold">{formatCurrency(totalExpenses)}</div>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="mb-8">
          <h3 className="text-base font-bold mb-3 p-2 bg-gray-100 border border-black text-center">
            TRANSACTION DETAILS
          </h3>
          
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-left w-20">Date</th>
                <th className="border border-black p-2 text-left">Description</th>
                <th className="border border-black p-2 text-left w-24">Account</th>
                <th className="border border-black p-2 text-left w-24">Category</th>
                <th className="border border-black p-2 text-center w-16">Type</th>
                <th className="border border-black p-2 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction, index) => {
                const account = accounts.find(acc => acc.id === transaction.account_id);
                const category = categories.find(cat => cat.id === transaction.category_id);
                
                return (
                  <tr key={transaction.id} className="transaction-row">
                    <td className="border border-black p-2 text-xs">
                      {format(new Date(transaction.date), 'dd/MM/yy')}
                    </td>
                    <td className="border border-black p-2 text-xs">
                      {transaction.description || 'Transaction'}
                    </td>
                    <td className="border border-black p-2 text-xs">
                      {account?.name || 'Unknown'}
                    </td>
                    <td className="border border-black p-2 text-xs">
                      {category?.name || 'Uncategorized'}
                    </td>
                    <td className="border border-black p-2 text-xs text-center capitalize">
                      {transaction.type}
                    </td>
                    <td className="border border-black p-2 text-xs text-right font-mono">
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
        <div className="mt-8 pt-4 border-t border-black text-center text-xs text-gray-600 no-break">
          <p className="mb-1"><strong>ChurchTrack Financial Management System</strong></p>
          <p>This is a computer-generated document. No signature required.</p>
          <p className="mt-2">Page generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>

        {/* Print Button */}
        <div className="print-button mt-8 text-center">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-8 py-3 rounded font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            🖨️ Print Statement
          </button>
        </div>
      </div>
    </>
  );
}