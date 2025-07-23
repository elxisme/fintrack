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
    return `N${new Intl.NumberFormat('en-NG').format(amount)}`;
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
        /* Print styles */
        @media print {
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
            color: #000;
          }
          
          /* Header styles to match image */
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .print-header h1 {
            font-size: 18px;
            font-weight: bold;
            margin: 5px 0;
          }
          .print-header h2 {
            font-size: 16px;
            font-weight: bold;
            margin: 5px 0 10px;
          }
          .print-header p {
            font-size: 14px;
            margin: 3px 0;
          }
          
          /* Summary boxes */
          .summary-grid {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 15px 0;
            flex-wrap: wrap;
          }
          .summary-box {
            border: 1px solid #000;
            padding: 10px 15px;
            text-align: center;
            min-width: 150px;
          }
          .summary-box h3 {
            font-weight: bold;
            font-size: 14px;
            margin: 0 0 5px 0;
          }
          .summary-box p {
            font-size: 14px;
            margin: 0;
          }
          
          /* Transactions table */
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          .transactions-table th,
          .transactions-table td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
          }
          .transactions-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          /* Footer */
          .print-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #555;
          }
          
          /* Hide screen-only elements */
          .screen-only {
            display: none !important;
          }
        }
        
        /* Screen styles */
        @media screen {
          .print-only {
            display: none;
          }
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
        }
      `}</style>

      {/* Main print container */}
      <div className="print-container">
        {/* Header section - matches the image exactly */}
        <div className="print-header">
          <h1>CHURCH OF CHRIST, KAGINI</h1>
          <h2>STATEMENT OF ACCOUNT</h2>
          <p>Period: {dateRange.label}</p>
        </div>

        {/* Summary section - matches the image layout */}
        <div className="summary-grid">
          <div className="summary-box">
            <h3>TOTAL BAL</h3>
            <p>{formatCurrency(totalBalance)}</p>
          </div>
          <div className="summary-box">
            <h3>NET INCOME</h3>
            <p>{formatCurrency(netIncome)}</p>
          </div>
          <div className="summary-box">
            <h3>TOTAL INCOME</h3>
            <p>{formatCurrency(totalIncome)}</p>
          </div>
          <div className="summary-box">
            <h3>TOTAL EXPENSES</h3>
            <p>{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Transactions table */}
        <div>
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
                    <td>{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
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

        {/* Footer */}
        <div className="print-footer">
          <p>Generated by CoCKFin Financial Management System</p>
          <p>This is a computer-generated document and does not require a signature.</p>
        </div>

        {/* Print button (screen only) */}
        <div className="screen-only mt-8 text-center">
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