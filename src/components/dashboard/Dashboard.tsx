import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, CreditCard, RefreshCw, Wallet, PiggyBank, Target, Calendar, Filter } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { useAuthStore } from '../../store/auth-store';
import { supabase } from '../../lib/supabase';
import { syncService } from '../../lib/sync-service';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import CategoryPieChart from './CategoryPieChart';

interface DashboardProps {
  addToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }) => void;
}

interface UserProfile {
  full_name: string | null;
}

type TimeRange = 'thisMonth' | 'last3Months' | 'thisYear' | 'allTime';

export default function Dashboard({ addToast }: DashboardProps) {
  const authStore = useAuthStore();
  const { user } = authStore;
  const { accounts, transactions, categories, loadData, isOnline, syncInProgress } = useFinanceStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('thisMonth');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadData(user.id);
      loadUserProfile();
    }
  }, [user, loadData]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline || syncInProgress || manualSyncLoading) return;

    setManualSyncLoading(true);
    
    try {
      await syncService.sync();
      
      // Reload data after sync
      if (user) {
        await loadData(user.id);
      }
      
      addToast({
        type: 'success',
        title: 'Sync complete'
      });
    } catch (error) {
      console.error('Manual sync failed:', error);
      addToast({
        type: 'error',
        title: 'Sync failed'
      });
    } finally {
      setManualSyncLoading(false);
    }
  };

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (selectedTimeRange) {
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: format(now, 'MMMM yyyy')
        };
      case 'last3Months':
        return {
          start: startOfMonth(subMonths(now, 2)),
          end: endOfMonth(now),
          label: 'Last 3 months'
        };
      case 'thisYear':
        return {
          start: startOfYear(now),
          end: endOfMonth(now),
          label: format(now, 'yyyy')
        };
      case 'allTime':
        return {
          start: new Date(0),
          end: endOfMonth(now),
          label: 'All time'
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

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum, account) => {
    return sum + account.current_balance;
  }, 0);

  const netIncome = totalIncome - totalExpenses;

  // Prepare pie chart data
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const pieChartData = expenseCategories.map(category => {
    const categoryTransactions = filteredTransactions.filter(t => 
      t.type === 'expense' && 
      t.category_id === category.id &&
      (selectedCategories.length === 0 || selectedCategories.includes(category.id))
    );
    
    const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      id: category.id,
      name: category.name,
      amount,
      color: category.color,
      transactionCount: categoryTransactions.length
    };
  }).filter(item => item.amount > 0); // Only show categories with expenses

  const stats = [
    {
      title: 'Total Balance',
      value: totalBalance,
      icon: Wallet,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    {
      title: `Income (${dateRange.label})`,
      value: totalIncome,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    {
      title: `Expenses (${dateRange.label})`,
      value: totalExpenses,
      icon: TrendingDown,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-700'
    },
    {
      title: 'Net Income',
      value: netIncome,
      icon: netIncome >= 0 ? Target : TrendingDown,
      color: netIncome >= 0 ? 'green' : 'red',
      bgColor: netIncome >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
      iconColor: netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      borderColor: netIncome >= 0 ? 'border-green-200 dark:border-green-700' : 'border-red-200 dark:border-red-700'
    }
  ];

  const formatCurrency = (amount: number) => {
    return `₦${new Intl.NumberFormat('en-NG').format(amount)}`;
  };

  const getWelcomeMessage = () => {
    const firstName = userProfile?.full_name?.split(' ')[0];
    if (firstName) {
      return `Welcome back, ${firstName}!`;
    }
    return 'Welcome to ChurchTrack!';
  };

  // Check if there are any unsynced items
  const hasUnsyncedData = accounts.some(acc => !acc.is_synced) || 
                         transactions.some(trans => trans.sync_status === 'pending');

  const timeRangeOptions = [
    { value: 'thisMonth', label: 'This Month' },
    { value: 'last3Months', label: 'Last 3 Months' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'allTime', label: 'All Time' }
  ];

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-500 dark:via-blue-600 dark:to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{getWelcomeMessage()}</h2>
            <p className="text-blue-100 text-sm sm:text-base opacity-90">
              Here's the church financial overview for {dateRange.label}
            </p>
          </div>
          
          {/* Manual Sync Button */}
          <div className="flex items-center gap-3">
            {hasUnsyncedData && isOnline && (
              <div className="flex items-center gap-2 bg-blue-500/30 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-100">Pending sync</span>
              </div>
            )}
            
            <button
              onClick={handleManualSync}
              disabled={!isOnline || syncInProgress || manualSyncLoading}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                ${isOnline && !syncInProgress && !manualSyncLoading
                  ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 hover:scale-105 active:scale-95 shadow-sm'
                  : 'bg-white/10 text-white/60 border border-white/20 cursor-not-allowed'
                }
              `}
              title={!isOnline ? 'You are offline' : 'Synchronize your data'}
            >
              <RefreshCw className={`w-4 h-4 ${(syncInProgress || manualSyncLoading) ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {manualSyncLoading ? 'Syncing...' : 'Sync Data'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div key={index} className={`bg-white dark:bg-gray-900 rounded-xl border ${stat.borderColor} p-3 sm:p-4 lg:p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 hover:scale-105`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg border ${stat.borderColor} ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stat.iconColor}`} />
                </div>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                <p className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stat.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section with Filters */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Pie Chart */}
        <div className="xl:col-span-2">
          {/* Chart Controls */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Time Range Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-200"
                >
                  {timeRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedCategories([])}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedCategories.length === 0
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {expenseCategories.slice(0, 3).map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryToggle(category.id)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        selectedCategories.includes(category.id)
                          ? 'text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={selectedCategories.includes(category.id) ? { backgroundColor: category.color } : {}}
                    >
                      {category.name}
                    </button>
                  ))}
                  {expenseCategories.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{expenseCategories.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CategoryPieChart 
            data={pieChartData}
            title={`Expenses by Category (${dateRange.label})`}
          />
        </div>

        {/* Recent Accounts & Transactions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Accounts Overview */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Accounts
              </h3>
            </div>
            
            <div className="space-y-3">
              {accounts.slice(0, 4).map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{account.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 capitalize">{account.type}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                      {formatCurrency(account.current_balance)}
                    </p>
                    {!account.is_synced && (
                      <div className="w-2 h-2 bg-orange-400 rounded-full ml-auto mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
              
              {accounts.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">No accounts yet</p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                Recent Transactions
              </h3>
            </div>
            
            <div className="space-y-3">
              {transactions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((transaction) => {
                  const account = accounts.find(acc => acc.id === transaction.account_id);
                  
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {transaction.description || 'Transaction'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {account?.name} • {format(new Date(transaction.date), 'MMM d')}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2 ml-3">
                        <p className={`font-semibold text-sm sm:text-base ${
                          transaction.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        {transaction.sync_status === 'pending' && (
                          <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              
              {transactions.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">No transactions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}