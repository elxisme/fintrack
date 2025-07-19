import React, { useState, useEffect } from 'react';
import { User, Palette, Plus, Edit2, Trash2, Save, X, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { useFinanceStore } from '../../store/finance-store';
import { supabase } from '../../lib/supabase';
import CreateCategoryModal from './CreateCategoryModal';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
}

interface SettingsProps {
  addToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }) => void;
}

export default function Settings({ addToast }: SettingsProps) {
  const { user } = useAuthStore();
  const { categories, loadData, updateCategory, deleteCategory, exchangeRate, setExchangeRate } = useFinanceStore();
  const { isAdmin } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [localExchangeRateInput, setLocalExchangeRateInput] = useState('');
  const [pendingCurrency, setPendingCurrency] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('NGN'); // Default to Naira

  useEffect(() => {
    if (user) {
      loadProfile();
      loadData(user.id);
    }
  }, [user, loadData]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        addToast({
          type: 'error',
          title: 'Profile load failed'
        });
        return;
      }

      setProfile(data);
      setFullName(data.full_name || '');
      setCurrency(data.currency || 'NGN'); // Default to Naira if not set
    } catch (error) {
      console.error('Error loading profile:', error);
      addToast({
        type: 'error',
        title: 'Profile load failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === 'USD' && currency === 'NGN') {
      // Show exchange rate modal when switching from NGN to USD
      setPendingCurrency(newCurrency);
      setShowExchangeRateModal(true);
      setLocalExchangeRateInput(exchangeRate?.toString() || '');
    } else if (newCurrency === 'NGN' && currency === 'USD') {
      // Clear exchange rate when switching back to NGN
      setExchangeRate(null);
      setCurrency(newCurrency);
    } else {
      setCurrency(newCurrency);
    }
  };

  const handleExchangeRateSubmit = () => {
    const rate = parseFloat(localExchangeRateInput);
    if (!rate || rate <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid exchange rate'
      });
      return;
    }

    setExchangeRate(rate);
    setCurrency(pendingCurrency);
    setShowExchangeRateModal(false);
    setLocalExchangeRateInput('');
    setPendingCurrency('');
    
    addToast({
      type: 'success',
      title: `Exchange rate set to ₦${rate} per $1`
    });
  };

  const saveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          currency: currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving profile:', error);
        addToast({
          type: 'error',
          title: 'Save failed'
        });
        return;
      }

      setProfile(prev => prev ? {
        ...prev,
        full_name: fullName,
        currency: currency
      } : null);

      addToast({
        type: 'success',
        title: 'Profile updated'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      addToast({
        type: 'error',
        title: 'Save failed'
      });
    } finally {
      setSaving(false);
    }
  };

  const startEditCategory = (category: any) => {
    setEditingCategory(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const saveCategory = async (categoryId: string) => {
    try {
      const categoryToUpdate = categories.find(cat => cat.id === categoryId);
      if (!categoryToUpdate) return;

      const updatedCategory = {
        ...categoryToUpdate,
        name: editName,
        color: editColor
      };

      await updateCategory(updatedCategory);
      
      setEditingCategory(null);
      addToast({
        type: 'success',
        title: 'Category updated'
      });
    } catch (error) {
      console.error('Error updating category:', error);
      addToast({
        type: 'error',
        title: 'Update failed'
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteCategory(categoryId);

      addToast({
        type: 'success',
        title: 'Category deleted'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      addToast({
        type: 'error',
        title: 'Delete failed'
      });
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
    setEditColor('');
  };

  const handleCategoryCreated = () => {
    setShowCreateModal(false);
    addToast({
      type: 'success',
      title: 'Category created'
    });
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const currencies = [
    { code: 'NGN', name: 'Nigerian Naira (₦)', symbol: '₦' },
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Restricted</h3>
          <p className="text-gray-500 dark:text-gray-400">Only administrators can access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 sm:space-y-8 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200">
      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage administrator information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors duration-200"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {currency === 'USD' ? 'Amounts will be displayed in US Dollars' : 'Amounts will be displayed in Nigerian Naira'}
              {currency === 'USD' && exchangeRate && (
                <span className="block mt-1">Exchange rate: ₦{exchangeRate} per $1</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Categories</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage your transaction categories</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Income Categories */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Income Categories
            </h3>
            <div className="space-y-3">
              {incomeCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {editingCategory === category.id ? (
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded border border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors duration-200"
                      />
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => saveCategory(category.id)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{category.name}</span>
                        {!category.user_id && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">
                            Default
                          </span>
                        )}
                      </div>
                      {category.user_id && (
                        <div className="flex gap-1 sm:gap-2 ml-2">
                          <button
                            onClick={() => startEditCategory(category)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              Expense Categories
            </h3>
            <div className="space-y-3">
              {expenseCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {editingCategory === category.id ? (
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded border border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-colors duration-200"
                      />
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => saveCategory(category.id)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{category.name}</span>
                        {!category.user_id && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">
                            Default
                          </span>
                        )}
                      </div>
                      {category.user_id && (
                        <div className="flex gap-1 sm:gap-2 ml-2">
                          <button
                            onClick={() => startEditCategory(category)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCategoryCreated}
        />
      )}

      {/* Exchange Rate Modal */}
      {showExchangeRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Set Exchange Rate</h2>
              </div>
              <button
                onClick={() => {
                  setShowExchangeRateModal(false);
                  setPendingCurrency('');
                  setLocalExchangeRateInput('');
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base mb-4">
                Please enter the current exchange rate from Naira to USD to help with currency conversion.
              </p>

              <div className="mb-6">
                <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exchange Rate (₦ per $1)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₦</span>
                  <input
                    id="exchangeRate"
                    type="number"
                    step="0.01"
                    value={localExchangeRateInput}
                    onChange={(e) => setLocalExchangeRateInput(e.target.value)}
                    placeholder="1500.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors duration-200"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Example: If $1 = ₦1,500, enter 1500
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowExchangeRateModal(false);
                    setPendingCurrency('');
                    setLocalExchangeRateInput('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExchangeRateSubmit}
                  disabled={!localExchangeRateInput || parseFloat(localExchangeRateInput) <= 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
                >
                  Set Rate & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}