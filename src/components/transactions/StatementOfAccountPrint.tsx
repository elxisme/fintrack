import React, { useEffect } from 'react';
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
  
  // Inject print styles directly into the document head
  useEffect(() => {
    const printStyles = `
      @media print {
        @page {
          size: A4;
          margin: 0.5in;
        }
        
        body * {
          visibility: hidden;
        }
        
        .statement-print-container,
        .statement-print-container * {
          visibility: visible !important;
        }
        
        .statement-print-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          font-family: Arial, sans-serif !important;
          font-size: 12pt !important;
          line-height: 1.4 !important;
        }
        
        .no-print {
          display: none !important;
        }
        
        .print-page-break {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        .print-avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .print-table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 10pt !important;
        }
        
        .print-table thead {
          display: table-header-group !important;
        }
        
        .print-table th,
        .print-table td {
          border: 1pt solid #000 !important;
          padding: 4pt !important;
          text-align: left !important;
        }
        
        .print-table th {
          background: #f0f0f0 !important;
          font-weight: bold !important;
        }
        
        .print-table tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .print-summary-box {
          border: 2pt solid #000 !important;
          padding: 8pt !important;
          margin: 4pt !important;
          text-align: center !important;
          background: #f8f8f8 !important;
        }
        
        .print-header {
          text-align: center !important;
          margin-bottom: 20pt !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .print-footer {
          page-break-before: always !important;
          break-before: page !important;
          text-align: center !important;
          font-size: 10pt !important;
          border-top: 1pt solid #000 !important;
          padding-top: 10pt !important;
        }
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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

  // Calculate totals
  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Split transactions into chunks of 25 for better page breaks
  const TRANSACTIONS_PER_PAGE = 25;
  const transactionChunks = [];
  for (let i = 0; i < sortedTransactions.length; i += TRANSACTIONS_PER_PAGE) {
    transactionChunks.push(sortedTransactions.slice(i, i + TRANSACTIONS_PER_PAGE));
  }

  return (
    <div className="statement-print-container">
      {/* Header */}
      <div className="print-header print-avoid-break">
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 10pt 0' }}>
          CHURCH OF CHRIST, KAGINI
        </h1>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 15pt 0' }}>
          STATEMENT OF ACCOUNT
        </h2>
        <div style={{ fontSize: '11pt' }}>
          <p style={{ margin: '5pt 0' }}><strong>Period:</strong> {dateRange.label}</p>
          <p style={{ margin: '5pt 0' }}><strong>Generated on:</strong> {format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="print-avoid-break" style={{ marginBottom: '20pt' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10pt', marginBottom: '10pt' }}>
          <div className="print-summary-box">
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '0' }}>
              TOTAL BALANCE: {formatCurrency(totalBalance)}
            </h3>
          </div>
          <div className="print-summary-box">
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '0' }}>
              NET INCOME: {formatCurrency(netIncome)}
            </h3>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10pt' }}>
          <div className="print-summary-box">
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '0' }}>
              TOTAL INCOME: {formatCurrency(totalIncome)}
            </h3>
          </div>
          <div className="print-summary-box">
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '0' }}>
              TOTAL EXPENSES: {formatCurrency(totalExpenses)}
            </h3>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="print-page-break">
        <h3 style={{ 
          fontSize: '14pt', 
          fontWeight: 'bold', 
          background: '#f0f0f0', 
          padding: '8pt', 
          border: '1pt solid #000', 
          margin: '0 0 10pt 0' 
        }}>
          DETAILED TRANSACTIONS
        </h3>
        
        {transactionChunks.map((chunk, chunkIndex) => (
          <div key={chunkIndex} className={chunkIndex > 0 ? 'print-page-break' : ''}>
            {chunkIndex > 0 && (
              <h4 style={{ fontSize: '12pt', color: '#666', marginBottom: '10pt' }}>
                Detailed Transactions (Continued) - Page {chunkIndex + 1}
              </h4>
            )}
            
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Date</th>
                  <th style={{ width: '25%' }}>Description</th>
                  <th style={{ width: '18%' }}>Account</th>
                  <th style={{ width: '15%' }}>Category</th>
                  <th style={{ width: '10%' }}>Type</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((transaction) => {
                  const account = accounts.find(acc => acc.id === transaction.account_id);
                  const category = categories.find(cat => cat.id === transaction.category_id);
                  const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
                  
                  let description = transaction.description || 'Transaction';
                  if (transaction.type === 'transfer') {
                    description = `Transfer: ${account?.name} → ${targetAccount?.name}`;
                  }

                  const bgColor = transaction.type === 'income' ? '#f0f8f0' : 
                                 transaction.type === 'expense' ? '#f8f0f0' : '#f0f0f8';

                  return (
                    <tr key={transaction.id} style={{ backgroundColor: bgColor }}>
                      <td>{format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                      <td>{description}</td>
                      <td>{account?.name || 'Unknown Account'}</td>
                      <td>
                        {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{transaction.type}</td>
                      <td style={{ textAlign: 'right' }}>
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
            
            {chunkIndex < transactionChunks.length - 1 && (
              <div style={{ textAlign: 'center', margin: '10pt 0', fontStyle: 'italic', fontSize: '10pt' }}>
                Continued on next page...
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="print-footer print-avoid-break">
        <p style={{ margin: '5pt 0' }}>Generated by ChurchTrack Financial Management System</p>
        <p style={{ margin: '5pt 0' }}>This is a computer-generated document and does not require a signature.</p>
      </div>

      {/* Print Button */}
      <div className="no-print" style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => window.print()}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🖨️ Print Statement
        </button>
      </div>
    </div>
  );
}
