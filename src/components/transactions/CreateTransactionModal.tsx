import React, { useState } from 'react';
import { X, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { format } from 'date-fns';

interface CreateTransactionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTransactionModal({ onClose, onSuccess }: CreateTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [accountId, setAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { createTransaction, accounts, categories } = useFinanceStore();

  const availableCategories = categories.filter(cat => cat.type === type);
  const availableTargetAccounts = accounts.filter(acc => acc.id !== accountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !amount) return;
    
    // For transfers, target account is required
    if (type === 'transfer' && !targetAccountId) {
      setError('Please select a target account for the transfer');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await createTransaction({
        account_id: accountId,
        target_account_id: type === 'transfer' ? targetAccountId : null,
        category_id: type === 'transfer' ? null : (categoryId || null),
        amount: parseFloat(amount),
        description: description || (type === 'transfer' ? 'Transfer' : ''),
        date,
        type
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Reset target account when switching away from transfer
  const handleTypeChange = (newType: 'income' | 'expense' | 'transfer') => {
    setType(newType);
    if (newType !== 'transfer') {
      setTargetAccountId('');
    }
    if (newType === 'transfer') {
      setCategoryId('');
    }
  };

  const getTransactionTypeInfo = () => {
    switch (type) {
      case 'income':
        return {
          icon: ArrowUpRight,
          color: 'green',
          description: 'Money coming in'
        };
      case 'expense':
        return {
          icon: ArrowDownRight,
          color: 'red',
          description: 'Money going out'
        };
      case 'transfer':
        return {
          icon: ArrowRightLeft,
          color: 'blue',
          description: 'Move money between accounts'
        };
    }
  };

  const typeInfo = getTransactionTypeInfo();
  const Icon = typeInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Add Transaction</h2>
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

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { id: 'income', label: 'Income', icon: ArrowUpRight, color: 'green' },
                { id: 'expense', label: 'Expense', icon: ArrowDownRight, color: 'red' },
                { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'blue' }
              ].map((option) => {
                const OptionIcon = option.icon;
                const isSelected = type === option.id;
                
                const colorClasses = {
                  green: isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600',
                  red: isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600',
                  blue: isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
                };

                const iconColors = {
                  green: 'text-green-600 dark:text-green-400',
                  red: 'text-red-600 dark:text-red-400',
                  blue: 'text-blue-600 dark:text-blue-400'
                };

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleTypeChange(option.id as any)}
                    className={`p-3 sm:p-4 border-2 rounded-lg text-left hover:border-gray-400 dark:hover:border-gray-500 transition-colors ${colorClasses[option.color]}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <OptionIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColors[option.color]}`} />
                      <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{option.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {option.id === 'income' && 'Money coming in'}
                      {option.id === 'expense' && 'Money going out'}
                      {option.id === 'transfer' && 'Between accounts'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Account */}
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
              required
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (₦{new Intl.NumberFormat('en-NG').format(account.current_balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Target Account (for transfers only) */}
          {type === 'transfer' && (
            <div>
              <label htmlFor="targetAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Account
              </label>
              <select
                id="targetAccount"
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
                required
              >
                <option value="">Select target account</option>
                {availableTargetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (₦{new Intl.NumberFormat('en-NG').format(account.current_balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category (not for transfers) */}
          {type !== 'transfer' && (
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
              >
                <option value="">Select a category (optional)</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₦</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
                required
              />
            </div>
            {type === 'transfer' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This amount will be moved from the source to the target account
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'transfer' 
                  ? "Transfer description (optional)" 
                  : "What was this transaction for?"
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
              required
            />
          </div>

          {/* Transfer Summary */}
          {type === 'transfer' && accountId && targetAccountId && amount && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Transfer Summary</h4>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <div className="flex items-center justify-between">
                  <span>From:</span>
                  <span className="font-medium">{accounts.find(acc => acc.id === accountId)?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>To:</span>
                  <span className="font-medium">{accounts.find(acc => acc.id === targetAccountId)?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">₦{new Intl.NumberFormat('en-NG').format(parseFloat(amount) || 0)}</span>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || !accountId || !amount || (type === 'transfer' && !targetAccountId)}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              {loading ? 'Adding...' : `Add ${type === 'transfer' ? 'Transfer' : type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}