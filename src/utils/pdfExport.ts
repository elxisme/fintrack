import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { Transaction, Account, Category } from '../lib/offline-storage';

interface StatementData {
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

export function exportStatementToPDF(data: StatementData) {
  console.log('=== PDF Export Function Debug ===');
  console.log('Received data:', data);
  console.log('Transactions count:', data.transactions.length);
  console.log('Accounts count:', data.accounts.length);
  console.log('Categories count:', data.categories.length);
  console.log('Date range:', data.dateRange);
  console.log('Exchange rate:', data.exchangeRate);
  
  const { transactions, accounts, categories, dateRange, exchangeRate } = data;

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

  console.log('Calculated totals:', {
    totalBalance,
    totalIncome,
    totalExpenses,
    netIncome,
    incomeTransactionsCount: incomeTransactions.length,
    expenseTransactionsCount: expenseTransactions.length
  });

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  console.log('Sorted transactions for PDF:', sortedTransactions);

  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Statement of Account - ${dateRange.label}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
          background: white;
          padding: 15px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        
        .header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .header h2 {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .header-info {
          font-size: 10pt;
        }
        
        .summary-section {
          margin-bottom: 20px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .summary-box {
          border: 2px solid;
          padding: 10px;
          text-align: center;
          font-weight: bold;
        }
        
        .balance-box {
          background-color: #dbeafe;
          border-color: #3b82f6;
          color: #1e40af;
        }
        
        .income-box {
          background-color: #dcfce7;
          border-color: #22c55e;
          color: #15803d;
        }
        
        .expense-box {
          background-color: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .net-positive {
          background-color: #dcfce7;
          border-color: #22c55e;
          color: #15803d;
        }
        
        .net-negative {
          background-color: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .transactions-section {
          margin-top: 20px;
        }
        
        .section-title {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px solid #666;
          padding-bottom: 5px;
        }
        
        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9pt;
          margin-bottom: 20px;
        }
        
        .transactions-table th,
        .transactions-table td {
          border: 1px solid #666;
          padding: 6px;
          text-align: left;
        }
        
        .transactions-table th {
          background-color: #f3f4f6;
          font-weight: bold;
          font-size: 9pt;
        }
        
        .transactions-table td:last-child {
          text-align: right;
        }
        
        .income-row {
          border-left: 3px solid #22c55e;
        }
        
        .expense-row {
          border-left: 3px solid #ef4444;
        }
        
        .transfer-row {
          border-left: 3px solid #3b82f6;
        }
        
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #666;
          text-align: center;
          font-size: 9pt;
          color: #666;
        }
        
        /* Page break handling */
        .page-break {
          page-break-before: always;
        }
        
        .no-break {
          page-break-inside: avoid;
        }
        
        @page {
          margin: 1cm;
          size: A4;
        }
        
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1>CHURCH OF CHRIST, KAGINI (CoCKFin)</h1>
        <h2>STATEMENT OF ACCOUNT</h2>
        <div class="header-info">
          <p><strong>Period:</strong> ${dateRange.label}</p>
          <p><strong>Generated on:</strong> ${format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-grid">
          <div class="summary-box balance-box">
            <div>TOTAL CURRENT BALANCE</div>
            <div style="font-size: 12pt; margin-top: 5px;">${formatCurrency(totalBalance)}</div>
          </div>
          <div class="summary-box ${netIncome >= 0 ? 'net-positive' : 'net-negative'}">
            <div>NET INCOME</div>
            <div style="font-size: 12pt; margin-top: 5px;">${formatCurrency(netIncome)}</div>
          </div>
        </div>
        <div class="summary-grid">
          <div class="summary-box income-box">
            <div>TOTAL INCOME</div>
            <div style="font-size: 12pt; margin-top: 5px;">${formatCurrency(totalIncome)}</div>
          </div>
          <div class="summary-box expense-box">
            <div>TOTAL EXPENSES</div>
            <div style="font-size: 12pt; margin-top: 5px;">${formatCurrency(totalExpenses)}</div>
          </div>
        </div>
      </div>

      <!-- Detailed Transactions -->
      <div class="transactions-section">
        <div class="section-title">DETAILED TRANSACTIONS</div>
        <table class="transactions-table">
          <thead>
            <tr>
              <th style="width: 12%;">Date</th>
              <th style="width: 30%;">Description</th>
              <th style="width: 18%;">Account</th>
              <th style="width: 18%;">Category</th>
              <th style="width: 10%;">Type</th>
              <th style="width: 12%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${sortedTransactions.map((transaction) => {
              const account = accounts.find(acc => acc.id === transaction.account_id);
              const category = categories.find(cat => cat.id === transaction.category_id);
              const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
              
              let description = transaction.description || 'Transaction';
              if (transaction.type === 'transfer') {
                description = `Transfer: ${account?.name} → ${targetAccount?.name}`;
              }

              const rowClass = transaction.type === 'income' ? 'income-row' : 
                             transaction.type === 'expense' ? 'expense-row' : 'transfer-row';

              return `
                <tr class="${rowClass}">
                  <td>${format(new Date(transaction.date), 'MMM dd, yyyy')}</td>
                  <td>${description}</td>
                  <td>${account?.name || 'Unknown Account'}</td>
                  <td>${transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}</td>
                  <td style="text-transform: capitalize;">${transaction.type}</td>
                  <td style="text-align: right;">
                    ${transaction.type === 'expense' ? 
                      `-${formatCurrency(Math.abs(transaction.amount))}` : 
                      formatCurrency(Math.abs(transaction.amount))
                    }
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Generated by CoCKFin Financial Management System</p>
        <p>This is a computer-generated document and does not require a signature.</p>
      </div>
    </body>
    </html>
  `;

  // Create temporary element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = htmlContent;
  tempElement.style.position = 'absolute';
  tempElement.style.left = '-9999px';
  tempElement.style.top = '-9999px';
  document.body.appendChild(tempElement);

  // PDF options
  const options = {
    margin: [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right (in inches)
    filename: `Statement_of_Account_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      allowTaint: false
    },
    jsPDF: { 
      unit: 'in', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break',
      after: '.no-break',
      avoid: '.no-break'
    }
  };

  // Generate and download PDF
  return html2pdf()
    .set(options)
    .from(tempElement.firstElementChild)
    .save()
    .finally(() => {
      // Clean up temporary element
      document.body.removeChild(tempElement);
    });
}