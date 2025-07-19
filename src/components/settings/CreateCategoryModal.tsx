import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { useFinanceStore } from '../../store/finance-store';

interface CreateCategoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCategoryModal({ onClose, onSuccess }: CreateCategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuthStore();
  const { createCategory } = useFinanceStore();

  const predefinedColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      await createCategory({
        user_id: user.id,
        name: name.trim(),
        type,
        color
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error creating category:', err);
      setError(err.message || 'Failed to create category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Create Category</h2>
          </div>
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

          {/* Category Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Groceries, Rent, Salary"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base transition-colors duration-200"
              required
            />
          </div>

          {/* Category Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Category Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-colors ${
                  type === 'income' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Income</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Money coming in</p>
              </button>
              
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-colors ${
                  type === 'expense' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Expense</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Money going out</p>
              </button>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Category Color
            </label>
            <div className="space-y-4">
              {/* Color Picker */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Custom Color</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click to choose any color</p>
                </div>
              </div>

              {/* Predefined Colors */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Colors</p>
                <div className="grid grid-cols-8 gap-2">
                  {predefinedColors.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      onClick={() => setColor(presetColor)}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg border-2 transition-all ${
                        color === presetColor 
                          ? 'border-gray-900 dark:border-gray-100 scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: presetColor }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</p>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                {name || 'Category Name'}
              </span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full capitalize">
                {type}
              </span>
            </div>
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
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}