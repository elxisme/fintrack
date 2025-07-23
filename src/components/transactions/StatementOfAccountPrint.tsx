import React from 'react';
import { format } from 'date-fns';
import { Transaction, Account, Category } from '../../lib/offline-storage';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';

// Register fonts (optional, use system fonts or embed custom fonts)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v12/Helvetica.ttf' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v12/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontSize: 11,
    lineHeight: 1.3,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
    borderBottom: '2pt solid #4b5563',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textSm: {
    fontSize: 10,
  },
  summaryContainer: {
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryBox: {
    flex: 1,
    padding: 8,
    borderWidth: 2,
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 10,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#4b5563',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#4b5563',
    boxDecorationBreak: 'clone',
  },
  tableCell: {
    padding: 4,
    fontSize: 10,
    flex: 1,
  },
  tableCellRight: {
    padding: 4,
    fontSize: 10,
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    marginTop: 10,
    paddingTop: 4,
    borderTop: '1pt solid #4b5563',
    textAlign: 'center',
    fontSize: 10,
    color: '#4b5563',
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'medium',
    cursor: 'pointer',
  },
});

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

// PDF Document Component
const PDFDocument = ({
  transactions,
  accounts,
  categories,
  dateRange,
  exchangeRate,
}: StatementOfAccountPrintProps) => {
  // Format currency helper
  const formatCurrency = (amount: number) => {
    if (exchangeRate) {
      const usdAmount = amount / exchangeRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(usdAmount);
    }
    return `₦${new Intl.NumberFormat('en-NG').format(amount)}`;
  };

  // Calculate summaries
  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CHURCH OF CHRIST, KAGINI</Text>
          <Text style={styles.subtitle}>STATEMENT OF ACCOUNT</Text>
          <View style={styles.textSm}>
            <Text>Period: {dateRange.label}</Text>
            <Text>Generated on: {format(new Date(), 'MMMM dd, yyyy')}</Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryBox,
                { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
              ]}
            >
              <Text style={[styles.textSm, { fontWeight: 'bold', color: '#1e40af' }]}>
                TOT. BALANCE: {formatCurrency(totalBalance)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryBox,
                netIncome >= 0
                  ? { backgroundColor: '#dcfce7', borderColor: '#22c55e' }
                  : { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
              ]}
            >
              <Text
                style={[
                  styles.textSm,
                  {
                    fontWeight: 'bold',
                    color: netIncome >= 0 ? '#15803d' : '#b91c1c',
                  },
                ]}
              >
                NET INCOME: {formatCurrency(netIncome)}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryRow, { marginTop: 4 }]}>
            <View
              style={[
                styles.summaryBox,
                { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
              ]}
            >
              <Text style={[styles.textSm, { fontWeight: 'bold', color: '#15803d' }]}>
                TOTAL INCOME: {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryBox,
                { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
              ]}
            >
              <Text style={[styles.textSm, { fontWeight: 'bold', color: '#b91c1c' }]}>
                TOTAL EXPENSES: {formatCurrency(totalExpenses)}
              </Text>
            </View>
          </View>
        </View>

        {/* Detailed Transactions */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Date</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Description</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Account</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Category</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Type</Text>
            <Text style={[styles.tableCellRight, { fontWeight: 'bold' }]}>Amount</Text>
          </View>
          {sortedTransactions.map((transaction) => {
            const account = accounts.find(acc => acc.id === transaction.account_id);
            const category = categories.find(cat => cat.id === transaction.category_id);
            const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
            let description = transaction.description || 'Transaction';
            if (transaction.type === 'transfer') {
              description = `Transfer: ${account?.name} → ${targetAccount?.name}`;
            }

            return (
              <View
                key={transaction.id}
                style={[
                  styles.tableRow,
                  {
                    borderLeftWidth: 4,
                    borderLeftColor:
                      transaction.type === 'income'
                        ? '#22c55e'
                        : transaction.type === 'expense'
                        ? '#ef4444'
                        : '#3b82f6',
                  },
                ]}
                wrap={false}
              >
                <Text style={styles.tableCell}>
                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                </Text>
                <Text style={styles.tableCell}>{description}</Text>
                <Text style={styles.tableCell}>{account?.name || 'Unknown Account'}</Text>
                <Text style={styles.tableCell}>
                  {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                </Text>
                <Text style={styles.tableCell}>{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</Text>
                <Text style={styles.tableCellRight}>
                  {transaction.type === 'expense'
                    ? `-${formatCurrency(Math.abs(transaction.amount))}`
                    : formatCurrency(Math.abs(transaction.amount))}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated by ChurchTrack Financial Management System</Text>
          <Text>This is a computer-generated document and does not require a signature.</Text>
        </View>
      </Page>
    </Document>
  );
};

// Main React Component
export default function StatementOfAccountPrint({
  transactions,
  accounts,
  categories,
  dateRange,
  exchangeRate,
}: StatementOfAccountPrintProps) {
  const handlePrint = async () => {
    const doc = (
      <PDFDocument
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        dateRange={dateRange}
        exchangeRate={exchangeRate}
      />
    );
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'StatementOfAccount.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white text-black">
      {/* Preview (optional, can be styled with Tailwind as before) */}
      <div className="text-center mb-3 border-b-2 border-gray-800 pb-3">
        <h1 className="text-2xl font-bold mb-1">CHURCH OF CHRIST, KAGINI</h1>
        <h2 className="text-lg font-semibold mb-2">STATEMENT OF ACCOUNT</h2>
        <div className="text-sm">
          <p><strong>Period:</strong> {dateRange.label}</p>
          <p><strong>Generated on:</strong> {format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>
      <div className="mb-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-100 border-2 border-blue-400 p-3 text-center">
            <h3 className="text-md font-bold text-blue-800">
              TOT. BALANCE: {formatCurrency(accounts.reduce((sum, account) => sum + account.current_balance, 0))}
            </h3>
          </div>
          <div className={`text-center p-3 border-2 ${netIncome >= 0 ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'}`}>
            <h3 className={`text-md font-bold ${netIncome >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              NET INCOME: {formatCurrency(incomeTransactions.reduce((sum, t) => sum + t.amount, 0) - expenseTransactions.reduce((sum, t) => sum + t.amount, 0))}
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="bg-green-100 border-2 border-green-400 p-3 text-center">
            <h3 className="text-md font-bold text-green-800">
              TOTAL INCOME: {formatCurrency(incomeTransactions.reduce((sum, t) => sum + t.amount, 0))}
            </h3>
          </div>
          <div className="bg-red-100 border-2 border-red-400 p-3 text-center">
            <h3 className="text-md font-bold text-red-800">
              TOTAL EXPENSES: {formatCurrency(expenseTransactions.reduce((sum, t) => sum + t.amount, 0))}
            </h3>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-base font-bold mb-2 border-b border-gray-400">DETAILED TRANSACTIONS</h3>
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1 text-left font-semibold">Date</th>
              <th className="border border-gray-400 p-1 text-left font-semibold">Description</th>
              <th className="border border-gray-400 p-1 text-left font-semibold">Account</th>
              <th className="border border-gray-400 p-1 text-left font-semibold">Category</th>
              <th className="border border-gray-400 p-1 text-left font-semibold">Type</th>
              <th className="border border-gray-400 p-1 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((transaction) => {
                const account = accounts.find(acc => acc.id === transaction.account_id);
                const category = categories.find(cat => cat.id === transaction.category_id);
                const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
                let description = transaction.description || 'Transaction';
                if (transaction.type === 'transfer') {
                  description = `Transfer: ${account?.name} → ${targetAccount?.name}`;
                }
                return (
                  <tr key={transaction.id}>
                    <td className={`border border-gray-400 p-1 ${transaction.type === 'income' ? 'border-l-4 border-l-green-500' : transaction.type === 'expense' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="border border-gray-400 p-1">{description}</td>
                    <td className="border border-gray-400 p-1">{account?.name || 'Unknown Account'}</td>
                    <td className="border border-gray-400 p-1">
                      {transaction.type === 'transfer' ? 'Transfer' : (category?.name || 'Uncategorized')}
                    </td>
                    <td className="border border-gray-400 p-1 capitalize">{transaction.type}</td>
                    <td className="border border-gray-400 p-1 text-right">
                      {transaction.type === 'expense'
                        ? `-${formatCurrency(Math.abs(transaction.amount))}`
                        : formatCurrency(Math.abs(transaction.amount))}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 pt-1 border-t border-gray-400 text-center text-sm text-gray-600">
        <p>Generated by ChurchTrack Financial Management System</p>
        <p>This is a computer-generated document and does not require a signature.</p>
      </div>
      <div className="mt-3 text-center">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Print Statement
        </button>
      </div>
    </div>
  );
}