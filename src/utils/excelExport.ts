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

  // Prepare header data
  const headerData = [
    ['CHURCH OF CHRIST, KAGINI'],
    ['STATEMENT OF ACCOUNT'],
    [`Period: ${dateRange.label}`],
    [`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`],
    [''],
    ['INCOME SUMMARY'],
    ['Description', 'Amount']
  ];

  // Calculate income summary
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const incomeByCategory = categories
    .filter(cat => cat.type === 'income')
    .map(category => {
      const categoryTransactions = incomeTransactions.filter(t => t.category_id === category.id);
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return [category.name, formatCurrency(total)];
    })
    .filter(([, amount]) => amount !== formatCurrency(0));

  // Add uncategorized income if any
  const uncategorizedIncome = incomeTransactions
    .filter(t => !t.category_id)
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (uncategorizedIncome > 0) {
    incomeByCategory.push(['Uncategorized', formatCurrency(uncategorizedIncome)]);
  }

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  incomeByCategory.push(['TOTAL INCOME', formatCurrency(totalIncome)]);

  // Add income data to header
  headerData.push(...incomeByCategory);
  headerData.push(['']);
  headerData.push(['EXPENSE SUMMARY']);
  headerData.push(['Description', 'Amount']);

  // Calculate expense summary
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const expenseByCategory = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = expenseTransactions.filter(t => t.category_id === category.id);
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return [category.name, formatCurrency(total)];
    })
    .filter(([, amount]) => amount !== formatCurrency(0));

  // Add uncategorized expenses if any
  const uncategorizedExpenses = expenseTransactions
    .filter(t => !t.category_id)
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (uncategorizedExpenses > 0) {
    expenseByCategory.push(['Uncategorized', formatCurrency(uncategorizedExpenses)]);
  }

  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  expenseByCategory.push(['TOTAL EXPENSES', formatCurrency(totalExpenses)]);

  // Add expense data to header
  headerData.push(...expenseByCategory);
  headerData.push(['']);
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