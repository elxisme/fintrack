import React from 'react';
import { format } from 'date-fns';
import { Transaction, Account, Category } from '../../lib/offline-storage';
import './print-styles.css'; // Import the external print CSS

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

  // Helper function to get account name
  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Unknown Account';
  };

  // Helper function to get category name
  const getCategoryName = (categoryId: string | null, transactionType: string) => {
    if (transactionType === 'transfer') return 'Transfer';
    if (!categoryId) return 'Uncategorized';
    return categories.find(cat => cat.id === categoryId)?.name || 'Uncategorized';
  };

  // Helper function to get transaction description
  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.type === 'transfer') {
      const sourceAccount = getAccountName(transaction.account_id);
      const targetAccount = getAccountName(transaction.target_account_id || '');
      return `Transfer: ${sourceAccount} → ${targetAccount}`;
    }
    return transaction.description || 'Transaction';
  };

  return (
    <div className="print-content">
      {/* Header Section */}
      <div className="print-header">
        <h1>CHURCH OF CHRIST, KAGINI</h1>
        <h2>STATEMENT OF ACCOUNT</h2>
        <div>
          <p><strong>Period:</strong> {dateRange.label}</p>
          <p><strong>Generated on:</strong> {format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="summary-grid">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10pt', marginBottom: '15pt' }}>
          <div className="summary-box">
            <h3>TOTAL BALANCE: {formatCurrency(totalBalance)}</h3>
          </div>
          <div className="summary-box">
            <h3>NET INCOME: {formatCurrency(netIncome)}</h3>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10pt' }}>
          <div className="summary-box">
            <h3>TOTAL INCOME: {formatCurrency(totalIncome)}</h3>
          </div>
          <div className="summary-box">
            <h3>TOTAL EXPENSES: {formatCurrency(totalExpenses)}</h3>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="transactions-section">
        <div className="section-title">DETAILED TRANSACTIONS</div>
        
        <table className="transactions-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Date</th>
              <th style={{ width: '25%' }}>Description</th>
              <th style={{ width: '18%' }}>Account</th>
              <th style={{ width: '15%' }}>Category</th>
              <th style={{ width: '10%' }}>Type</th>
              <th style={{ width: '20%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction, index) => {
              const rowClass = transaction.type === 'income' ? 'income-row' : 
                              transaction.type === 'expense' ? 'expense-row' : '';
              
              return (
                <tr key={transaction.id} className={rowClass}>
                  <td>{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                  <td>{getTransactionDescription(transaction)}</td>
                  <td>{getAccountName(transaction.account_id)}</td>
                  <td>{getCategoryName(transaction.category_id, transaction.type)}</td>
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

      {/* Footer */}
      <div className="print-footer">
        <p>Generated by ChurchTrack Financial Management System</p>
        <p>This is a computer-generated document and does not require a signature.</p>
      </div>

      {/* Print Button (hidden when printing) */}
      <div className="no-print" style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => window.print()}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Print Statement
        </button>
      </div>
    </div>
  );
}