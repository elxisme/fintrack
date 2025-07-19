import React, { useState } from 'react';
import { X, Building, Banknote, CreditCard, Wallet } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { Account } from '../../lib/offline-storage';

interface EditAccountModalProps {
  account: Account;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAccountModal({ account, onClose, onSuccess }: EditAccountModalProps) {
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<'checking' | 'savings' | 'credit' | 'cash'>(account.type);
  const [initialBalance, setInitialBalance] = useState(account.initial_balance.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { updateAccount } = useFinanceStore();

  const accountTypes = [
    {
      id: 'checking' as const,
      name: 'Checking',
      description: 'For everyday spending',
      icon: Building,
      color: 'blue'
    },
    {
      id: 'savings' as const,
      name: 'Savings',
      description: 'For saving money',
      icon: Banknote,
      color: 'green'
    },
    {
      id: 'credit' as const,
      name: 'Credit Card',
      description: 'For credit spending',
      icon: CreditCard,
      color: 'red'
    },
    {
      id: 'cash' as const,
      name: 'Cash',
      description: 'Physical cash',
      icon: Wallet,
      color: 'gray'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    
    try {
      const balance = parseFloat(initialBalance) || 0;
      const balanceDifference = balance - account.initial_balance;
      
      const updatedAccount: Account = {
        ...account,
        name,
        type,
        initial_balance: balance,
        current_balance: account.current_balance + balanceDifference,
        updated_at: new Date().toISOString()
      };

      await updateAccount(updatedAccount);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Edit Account</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Account Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Checking, Emergency Fund"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
              required
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Account Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {accountTypes.map((accountType) => {
                const Icon = accountType.icon;
                const isSelected = type === accountType.id;
                
                const colorClasses = {
                  blue: isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600',
                  green: isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600',
                  red: isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600',
                  gray: isSelected ? 'border-gray-500 bg-gray-50 dark:bg-gray-800' : 'border-gray-300 dark:border-gray-600'
                };

                return (
                  <button
                    key={accountType.id}
                    type="button"
                    onClick={() => setType(accountType.id)}
                    className={`p-3 sm:p-4 border-2 rounded-lg text-left hover:border-gray-400 dark:hover:border-gray-500 transition-colors ${colorClasses[accountType.color]}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{accountType.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{accountType.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Balance */}
          <div>
            <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Balance
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₦</span>
              <input
                id="balance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current balance will be adjusted by the difference
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              {loading ? 'Updating...' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}