import * as XLSX from 'xlsx';
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

export function exportStatementToExcel(data: StatementData) {
  const { transactions, accounts, categories, dateRange, exchangeRate } = data;

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

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
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Prepare header data
  const headerData = [
    ['CHURCH OF CHRIST, KAGINI'],
    ['STATEMENT OF ACCOUNT'],
    [`Period: ${dateRange.label}`],
    [`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`],
    [''],
    ['TOTAL INCOME', formatCurrency(totalIncome)],
    [''],
    ['TOTAL EXPENSES', formatCurrency(totalExpenses)],
    ['']
  ];
  
  // Add net income
  headerData.push(['NET INCOME', formatCurrency(totalIncome - totalExpenses)]);
  headerData.push(['']);
  headerData.push(['DETAILED TRANSACTIONS']);
  headerData.push(['Date', 'Description', 'Account', 'Category', 'Type', 'Amount']);

  // Prepare transaction details
  const transactionData = transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(transaction => {
      const account = accounts.find(acc => acc.id === transaction.account_id);
      const category = categories.find(cat => cat.id === transaction.category_id);
      const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
      
      let description = transaction.description || 'Transaction';
      if (transaction.type === 'transfer') {
        description = `Transfer: ${account?.name} → ${targetAccount?.name}`;
      }

      return [
        format(new Date(transaction.date), 'MMM dd, yyyy'),
        description,
        account?.name || 'Unknown Account',
        transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized'),
        transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        transaction.type === 'expense' ? 
          `-${formatCurrency(Math.abs(transaction.amount))}` : 
          formatCurrency(Math.abs(transaction.amount))
      ];
    });

  // Combine all data
  const allData = [...headerData, ...transactionData];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(allData);

  // Set column widths
  worksheet['!cols'] = [
    { width: 20 }, // Date/Description
    { width: 30 }, // Description/Amount
    { width: 20 }, // Account
    { width: 20 }, // Category
    { width: 15 }, // Type
    { width: 15 }  // Amount
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statement of Account');

  // Generate filename
  const filename = `Statement_of_Account_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
}