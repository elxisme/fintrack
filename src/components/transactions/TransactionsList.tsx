import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Filter, Edit2, Trash2, MoreVertical, ChevronDown, Tag, Download, FileText, Calendar } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import CreateTransactionModal from './CreateTransactionModal';
import EditTransactionModal from './EditTransactionModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import StatementOfAccountPrint from './StatementOfAccountPrint';
import { Transaction } from '../../lib/offline-storage';
import { useAuthStore } from '../../store/auth-store';
import { exportStatementToExcel } from '../../utils/excelExport';

interface TransactionsListProps {
  addToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }) => void;
}

const TRANSACTIONS_INCREMENT = 10;

type DateRangeFilter = 'thisMonth' | 'lastMonth' | 'custom';

function TransactionsList({ addToast }: TransactionsListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [visibleTransactionsCount, setVisibleTransactionsCount] = useState(TRANSACTIONS_INCREMENT);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showPrintStatement, setShowPrintStatement] = useState(false);
  
  const { transactions, accounts, categories, deleteTransaction, exchangeRate } = useFinanceStore();
  const authStore = useAuthStore();
  const isAdmin = authStore?.isAdmin ?? false;

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateRangeFilter) {
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, 'MMMM yyyy')
        };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
          label: format(lastMonth, 'MMMM yyyy')
        };
      case 'custom':
        return {
          start: new Date(customStartDate),
          end: new Date(customEndDate),
          label: `${format(new Date(customStartDate), 'MMM dd, yyyy')} - ${format(new Date(customEndDate), 'MMM dd, yyyy')}`
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, 'MMMM yyyy')
        };
    }
  };

  const dateRange = getDateRange();

  const filteredTransactions = transactions
    .filter(transaction => {
      // Filter by date range
      const transactionDate = new Date(transaction.date);
      if (transactionDate < dateRange.start || transactionDate > dateRange.end) return false;
      
      // Filter by transaction type
      if (filter !== 'all' && transaction.type !== filter) return false;
      
      // Filter by category
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'uncategorized') {
          return !transaction.category_id;
        } else {
          return transaction.category_id === categoryFilter;
        }
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const visibleTransactions = filteredTransactions.slice(0, visibleTransactionsCount);
  const hasMoreTransactions = filteredTransactions.length > visibleTransactionsCount;

  // Calculate total amount for filtered transactions
  const filteredTotal = filteredTransactions.reduce((sum, transaction) => {
    return sum + Math.abs(transaction.amount);
  }, 0);

  const formatCurrency = (amount: number) => {
    // Use the same logic as Dashboard for consistency
    if (exchangeRate) {
      const usdAmount = amount / exchangeRate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(usdAmount);
    }
    return `₦${new Intl.NumberFormat('en-NG').format(amount)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return ArrowUpRight;
      case 'expense':
        return ArrowDownRight;
      case 'transfer':
        return ArrowRightLeft;
      default:
        return ArrowUpRight;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 dark:text-green-400';
      case 'expense':
        return 'text-red-600 dark:text-red-400';
      case 'transfer':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleTransactionCreated = () => {
    setShowCreateModal(false);
    addToast({
      type: 'success',
      title: 'Transaction added'
    });
  };

  const handleTransactionUpdated = () => {
    setEditingTransaction(null);
    addToast({
      type: 'success',
      title: 'Transaction updated'
    });
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
      addToast({
        type: 'success',
        title: 'Transaction deleted'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete failed'
      });
    }
  };

  const toggleDropdown = (transactionId: string) => {
    setActiveDropdown(activeDropdown === transactionId ? null : transactionId);
  };

  const loadMoreTransactions = () => {
    setVisibleTransactionsCount(prev => prev + TRANSACTIONS_INCREMENT);
  };

  const handleExportExcel = () => {
    exportStatementToExcel({
      transactions: filteredTransactions,
      accounts,
      categories,
      dateRange,
      exchangeRate
    });
    setShowExportOptions(false);
    addToast({
      type: 'success',
      title: 'Excel file downloaded',
      message: 'Statement of Account has been exported to Excel'
    });
  };

  const handlePrintStatement = () => {
    setShowPrintStatement(true);
    setShowExportOptions(false);
  };

  // Get unique categories from transactions for filter
  const availableCategories = categories.filter(cat => 
    transactions.some(t => t.category_id === cat.id)
  );

  // Check if there are uncategorized transactions
  const hasUncategorizedTransactions = transactions.some(t => !t.category_id);

  // Get the selected category name for display
  const getSelectedCategoryName = () => {
    if (categoryFilter === 'all') return 'all categories';
    if (categoryFilter === 'uncategorized') return 'uncategorized';
    const category = categories.find(cat => cat.id === categoryFilter);
    return category ? category.name.toLowerCase() : 'selected category';
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {isAdmin ? 'Track church income, expenses, and transfers' : 'View church income, expenses, and transfers'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Transaction
          </button>
        )}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Export
            </button>

            {showExportOptions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowExportOptions(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                  <button
                    onClick={handlePrintStatement}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Print Statement</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Open printable version</div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <Download className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Download Excel</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Export as XLSX file</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value as DateRangeFilter);
              setVisibleTransactionsCount(TRANSACTIONS_INCREMENT);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRangeFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setVisibleTransactionsCount(TRANSACTIONS_INCREMENT);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
            />
            <span className="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setVisibleTransactionsCount(TRANSACTIONS_INCREMENT);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
            />
          </div>
        )}

        {/* Transaction Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'income', label: 'Income' },
              { id: 'expense', label: 'Expenses' },
              { id: 'transfer', label: 'Transfers' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setFilter(option.id as any);
                  setVisibleTransactionsCount(TRANSACTIONS_INCREMENT); // Reset pagination when filter changes
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  filter === option.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setVisibleTransactionsCount(TRANSACTIONS_INCREMENT); // Reset pagination when filter changes
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
          >
            <option value="all">All Categories</option>
            {hasUncategorizedTransactions && (
              <option value="uncategorized">Uncategorized</option>
            )}
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count and Total */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
        <span>
          Showing {visibleTransactions.length} of {filteredTransactions.length} transactions for {dateRange.label}
        </span>
        {filteredTransactions.length > 0 && (
          <>
            <span className="hidden sm:inline">•</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Total: {formatCurrency(filteredTotal)} for {getSelectedCategoryName()}
            </span>
          </>
        )}
      </div>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {visibleTransactions.map((transaction) => {
              const account = accounts.find(acc => acc.id === transaction.account_id);
              const targetAccount = accounts.find(acc => acc.id === transaction.target_account_id);
              const category = categories.find(cat => cat.id === transaction.category_id);
              const Icon = getTransactionIcon(transaction.type);
              const colorClass = getTransactionColor(transaction.type);

              return (
                <div key={transaction.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${colorClass} flex-shrink-0`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {transaction.type === 'transfer' 
                            ? `Transfer: ${account?.name} → ${targetAccount?.name}`
                            : (transaction.description || 'Transaction')
                          }
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {transaction.type === 'transfer' ? (
                            <>
                              <span className="truncate">{transaction.description || 'Transfer'}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="whitespace-nowrap">{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                            </>
                          ) : (
                            <>
                              <span className="truncate">{account?.name}</span>
                              {category && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span 
                                    className="truncate flex items-center gap-1"
                                    style={{ color: category.color }}
                                  >
                                    <div 
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: category.color }}
                                    ></div>
                                    {category.name}
                                  </span>
                                </>
                              )}
                              {!category && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-gray-400 dark:text-gray-500 italic">Uncategorized</span>
                                </>
                              )}
                              <span className="hidden sm:inline">•</span>
                              <span className="whitespace-nowrap">{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex items-center gap-2 sm:gap-3 ml-3">
                      <div>
                        <p className={`text-base sm:text-lg font-semibold ${colorClass}`}>
                          {transaction.type === 'transfer' 
                            ? formatCurrency(Math.abs(transaction.amount))
                            : `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}`
                          }
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {transaction.type}
                        </p>
                      </div>
                      
                      {transaction.sync_status === 'pending' && (
                        <div className="w-3 h-3 bg-orange-400 rounded-full flex-shrink-0" title="Not synced" />
                      )}

                      {/* Actions Dropdown */}
                      {isAdmin && (
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(transaction.id)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdown === transaction.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveDropdown(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                                <button
                                  onClick={() => {
                                    setEditingTransaction(transaction);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Edit Transaction
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletingTransaction(transaction);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Transaction
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMoreTransactions && (
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={loadMoreTransactions}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <ChevronDown className="w-4 h-4" />
                Load More ({filteredTransactions.length - visibleTransactionsCount} remaining)
              </button>
            </div>
          )}
        </div>
        ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
            {filter === 'all' && categoryFilter === 'all' 
              ? 'No transactions yet'
              : 'No transactions match your filters'
            }
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm sm:text-base">
            {filter === 'all' && categoryFilter === 'all'
              ? (isAdmin ? 'Start by recording your first transaction' : 'No transactions have been recorded yet')
              : 'Try adjusting your filters or create a new transaction'
            }
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 inline-flex items-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add Transaction
            </button>
          )}
        </div>
        )}
      </div>

      {/* Create Transaction Modal */}
      {showCreateModal && isAdmin && (
        <CreateTransactionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTransactionCreated}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && isAdmin && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleTransactionUpdated}
        />
      )}

             {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTransaction}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteTransaction}
        onCancel={() => setDeletingTransaction(null)}
      />

      {/* Print Statement Modal */}
      {showPrintStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Statement of Account - {dateRange.label}</h2>
              <button
                onClick={() => setShowPrintStatement(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>
            <StatementOfAccountPrint
              transactions={filteredTransactions}
              accounts={accounts}
              categories={categories}
              dateRange={dateRange}
              exchangeRate={exchangeRate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionsList;