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
        /* Import Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        /* Print styles */
        @media print {
          * {
            box-sizing: border-box;
          }
          
          @page {
            margin: 15mm;
            size: A4;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', Arial, sans-serif;
            color: #1a1a1a;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            line-height: 1.4;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-container, .print-container * {
            visibility: visible;
          }
          
          .print-container {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          
          .statement-card {
            background: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            transform: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
            background: white !important;
            color: #1a1a1a !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .print-header::before {
            display: none !important;
          }
          
          .print-header h1 {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: #1e40af !important;
            letter-spacing: 0.5px;
            text-shadow: none !important;
          }
          
          .print-header h2 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 12px 0;
            color: #374151 !important;
          }
          
          .print-header .meta-info {
            font-size: 11px;
            color: #6b7280 !important;
            margin: 3px 0;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 15px 0;
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          
          .summary-box {
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 10px;
            text-align: center;
            background: #f9fafb !important;
            page-break-inside: avoid;
          }
          
          .summary-box.total-balance {
            border-color: #3b82f6;
            background: #eff6ff !important;
          }
          
          .summary-box.net-income {
            border-color: #10b981;
            background: #ecfdf5 !important;
          }
          
          .summary-box.total-income {
            border-color: #059669;
            background: #f0fdf4 !important;
          }
          
          .summary-box.total-expenses {
            border-color: #dc2626;
            background: #fef2f2 !important;
          }
          
          .summary-box::before {
            display: none !important;
          }
          
          .summary-box h3 {
            font-weight: 600;
            font-size: 9px;
            margin: 0 0 6px 0;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .summary-box.total-balance h3 { color: #1d4ed8 !important; }
          .summary-box.net-income h3 { color: #047857 !important; }
          .summary-box.total-income h3 { color: #065f46 !important; }
          .summary-box.total-expenses h3 { color: #b91c1c !important; }
          
          .summary-box .amount {
            font-size: 11px;
            font-weight: 700;
            margin: 0;
            color: #111827 !important;
          }
          
          .transactions-section {
            margin-top: 20px;
            page-break-inside: auto;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151 !important;
            margin-bottom: 10px;
            padding: 8px 12px;
            background: #f3f4f6 !important;
            border-left: 3px solid #3b82f6;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin-top: 5px;
            page-break-inside: auto;
            table-layout: fixed;
          }
          
          .transactions-table thead {
            display: table-header-group;
          }
          
          .transactions-table th {
            background: #f8fafc !important;
            border: 1px solid #d1d5db;
            padding: 6px 4px;
            text-align: left;
            font-weight: 600;
            color: #374151 !important;
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          .transactions-table tbody {
            display: table-row-group;
          }
          
          .transactions-table tbody tr {
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: auto;
            orphans: 2;
            widows: 2;
          }
          
          .transactions-table tbody tr:nth-child(25n) {
            page-break-after: page;
          }
          
          .transactions-table td {
            border: 1px solid #e5e7eb;
            padding: 4px;
            font-size: 7px;
            color: #4b5563 !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          
          .transactions-table tr:nth-child(even) {
            background: #f9fafb !important;
          }
          
          .transactions-table .amount-cell {
            text-align: right;
            font-weight: 500;
          }
          
          .transactions-table .income-row {
            border-left: 2px solid #10b981;
          }
          
          .transactions-table .expense-row {
            border-left: 2px solid #ef4444;
          }
          
          .transactions-table .transfer-row {
            border-left: 2px solid #6366f1;
          }
          
          /* Column widths for better layout */
          .transactions-table th:nth-child(1),
          .transactions-table td:nth-child(1) { width: 12%; }
          .transactions-table th:nth-child(2),
          .transactions-table td:nth-child(2) { width: 25%; }
          .transactions-table th:nth-child(3),
          .transactions-table td:nth-child(3) { width: 18%; }
          .transactions-table th:nth-child(4),
          .transactions-table td:nth-child(4) { width: 18%; }
          .transactions-table th:nth-child(5),
          .transactions-table td:nth-child(5) { width: 12%; }
          .transactions-table th:nth-child(6),
          .transactions-table td:nth-child(6) { width: 15%; }
          
          .print-footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 8px;
            color: #6b7280 !important;
            page-break-inside: avoid;
            page-break-before: avoid;
          }
          
          .screen-only {
            display: none !important;
          }
          
          /* Ensure proper page breaks for long tables */
          .transactions-table-wrapper {
            page-break-inside: auto;
            overflow: visible;
          }
          
          /* Force break after every 20-25 rows to prevent overflow */
          .page-break-row {
            page-break-after: page;
          }
        }
        
        /* Screen styles */
        @media screen {
          .print-only {
            display: none;
          }
          
          .print-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          
          .statement-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
            transition: all 0.3s ease;
          }
          
          .statement-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.35);
          }
          
          .print-header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            text-align: center;
            padding: 40px 30px;
            position: relative;
            overflow: hidden;
          }
          
          .print-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
          }
          
          @keyframes shimmer {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(180deg); }
          }
          
          .print-header h1 {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 12px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
            z-index: 1;
          }
          
          .print-header h2 {
            font-size: 20px;
            font-weight: 500;
            margin: 0 0 20px 0;
            opacity: 0.95;
            position: relative;
            z-index: 1;
          }
          
          .print-header .meta-info {
            font-size: 14px;
            opacity: 0.9;
            margin: 8px 0;
            position: relative;
            z-index: 1;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8fafc;
          }
          
          .summary-box {
            background: white;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .summary-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            transition: all 0.3s ease;
          }
          
          .summary-box:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
          }
          
          .summary-box.total-balance::before { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
          .summary-box.net-income::before { background: linear-gradient(90deg, #10b981, #047857); }
          .summary-box.total-income::before { background: linear-gradient(90deg, #059669, #065f46); }
          .summary-box.total-expenses::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
          
          .summary-box h3 {
            font-weight: 600;
            font-size: 14px;
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b7280;
          }
          
          .summary-box .amount {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            color: #111827;
          }
          
          .transactions-section {
            padding: 30px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 20px;
            padding: 15px 20px;
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            border-radius: 8px;
            border-left: 5px solid #3b82f6;
          }
          
          .transactions-table-wrapper {
            overflow-x: auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            overflow: hidden;
          }
          
          .transactions-table th {
            background: linear-gradient(135deg, #374151, #4b5563);
            color: white;
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .transactions-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            transition: background-color 0.2s ease;
          }
          
          .transactions-table tr:hover td {
            background: #f8fafc;
          }
          
          .transactions-table .amount-cell {
            text-align: right;
            font-weight: 600;
          }
          
          .transactions-table .income-row {
            border-left: 4px solid #10b981;
          }
          
          .transactions-table .expense-row {
            border-left: 4px solid #ef4444;
          }
          
          .transactions-table .transfer-row {
            border-left: 4px solid #6366f1;
          }
          
          .print-footer {
            text-align: center;
            padding: 30px;
            background: #f8fafc;
            color: #6b7280;
            font-size: 12px;
          }
          
          .print-button {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
          }
          
          .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(59, 130, 246, 0.5);
          }
          
          .print-button:active {
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Main print container */}
      <div className="print-container">
        <div className="statement-card">
          {/* Header section */}
          <div className="print-header">
            <h1>CHURCH OF CHRIST, KAGINI</h1>
            <h2>STATEMENT OF ACCOUNT</h2>
            <div className="meta-info">Period: {dateRange.label}</div>
            <div className="meta-info">Generated on: {format(new Date(), 'MMMM dd, yyyy')}</div>
          </div>

          {/* Summary section */}
          <div className="summary-grid">
            <div className="summary-box total-balance">
              <h3>Total Balance</h3>
              <div className="amount">{formatCurrency(totalBalance)}</div>
            </div>
            <div className="summary-box net-income">
              <h3>Net Income</h3>
              <div className="amount">{formatCurrency(netIncome)}</div>
            </div>
            <div className="summary-box total-income">
              <h3>Total Income</h3>
              <div className="amount">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="summary-box total-expenses">
              <h3>Total Expenses</h3>
              <div className="amount">{formatCurrency(totalExpenses)}</div>
            </div>
          </div>

          {/* Transactions section */}
          <div className="transactions-section">
            <div className="section-title">Detailed Transactions</div>
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Account</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
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

                    const rowClass = transaction.type === 'income' ? 'income-row' : 
                                   transaction.type === 'expense' ? 'expense-row' : 'transfer-row';

                    // Add page break class every 25 rows for print
                    const shouldBreak = (index + 1) % 25 === 0 && index !== sortedTransactions.length - 1;
                    const finalRowClass = shouldBreak ? `${rowClass} page-break-row` : rowClass;

                    return (
                      <tr key={transaction.id} className={finalRowClass}>
                        <td>{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                        <td>{description}</td>
                        <td>{account?.name || 'Unknown Account'}</td>
                        <td>
                          {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{transaction.type}</td>
                        <td className="amount-cell">
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

          {/* Footer */}
          <div className="print-footer">
            <p>Generated by ChurchTrack Financial Management System</p>
            <p>This is a computer-generated document and does not require a signature.</p>
          </div>
        </div>

        {/* Print button (screen only) */}
        <div className="screen-only" style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => window.print()}
            className="print-button"
          >
            Print Statement
          </button>
        </div>
      </div>
    </>
  );
}