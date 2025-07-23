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