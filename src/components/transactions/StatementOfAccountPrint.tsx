import React from 'react';

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
  // Date formatting helper
  const formatDate = (dateStr, format = 'full') => {
    const date = new Date(dateStr);
    if (format === 'short') {
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

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
        @page {
          size: A4;
          margin: 15mm;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          .print-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            height: auto !important;
            min-height: auto !important;
          }
          
          .print-header {
            page-break-after: avoid;
            page-break-inside: avoid;
            margin-bottom: 15px !important;
          }
          
          .print-summary {
            page-break-inside: avoid;
            margin-bottom: 15px !important;
          }
          
          .transactions-section {
            page-break-inside: auto;
          }
          
          .transaction-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          
          .transaction-table thead {
            display: table-header-group;
          }
          
          .transaction-table thead tr {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .transaction-table tbody tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          .transaction-table tbody tr:nth-child(10n) {
            page-break-after: auto;
          }
          
          .print-footer {
            page-break-inside: avoid;
            margin-top: 20px !important;
          }
          
          .print-button {
            display: none !important;
          }
          
          th, td {
            border: 1px solid #000 !important;
            padding: 3px !important;
            font-size: 10px !important;
            vertical-align: top !important;
          }
          
          th {
            background-color: #e5e5e5 !important;
            font-weight: bold !important;
          }
          
          .header-title {
            font-size: 16px !important;
            font-weight: bold !important;
            margin-bottom: 5px !important;
          }
          
          .summary-box {
            border: 2px solid #000 !important;
            background-color: #f8f8f8 !important;
            padding: 8px !important;
          }
          
          .summary-title {
            font-size: 11px !important;
            font-weight: bold !important;
          }
          
          .summary-amount {
            font-size: 13px !important;
            font-weight: bold !important;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 20px auto;
            padding: 20px;
            background: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            min-height: 297mm;
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
            <p><strong>Generated:</strong> {formatDate(new Date())}</p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="print-summary mb-8">
          <h3 className="text-base font-bold mb-4 text-center">FINANCIAL SUMMARY</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="summary-box p-4 text-center border-2 border-black bg-gray-100">
              <div className="summary-title text-sm font-semibold mb-1">CURRENT BALANCE</div>
              <div className="summary-amount text-lg font-bold">{formatCurrency(totalBalance)}</div>
            </div>
            <div className={`summary-box p-4 text-center border-2 border-black ${netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="summary-title text-sm font-semibold mb-1">NET INCOME</div>
              <div className="summary-amount text-lg font-bold">{formatCurrency(netIncome)}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="summary-box p-4 text-center border-2 border-black bg-green-50">
              <div className="summary-title text-sm font-semibold mb-1">TOTAL INCOME</div>
              <div className="summary-amount text-base font-bold">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="summary-box p-4 text-center border-2 border-black bg-red-50">
              <div className="summary-title text-sm font-semibold mb-1">TOTAL EXPENSES</div>
              <div className="summary-amount text-base font-bold">{formatCurrency(totalExpenses)}</div>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="transactions-section">
          <h3 className="text-base font-bold mb-3 p-2 bg-gray-100 border border-black text-center">
            TRANSACTION DETAILS
          </h3>
          
          <table className="transaction-table w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2 text-left w-16">Date</th>
                <th className="border border-black p-2 text-left">Description</th>
                <th className="border border-black p-2 text-left w-20">Account</th>
                <th className="border border-black p-2 text-left w-20">Category</th>
                <th className="border border-black p-2 text-center w-12">Type</th>
                <th className="border border-black p-2 text-right w-20">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction, index) => {
                const account = accounts.find(acc => acc.id === transaction.account_id);
                const category = categories.find(cat => cat.id === transaction.category_id);
                
                return (
                  <tr key={transaction.id}>
                    <td className="border border-black p-2 text-xs">
                      {formatDate(transaction.date, 'short')}
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
        <div className="print-footer mt-8 pt-4 border-t border-black text-center text-xs text-gray-600">
          <p className="mb-1"><strong>ChurchTrack Financial Management System</strong></p>
          <p>This is a computer-generated document. No signature required.</p>
          <p className="mt-2">Page generated on {formatDateTime(new Date())}</p>
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