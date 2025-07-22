import React, { useState, useEffect } from 'react';
import { User, Palette, Plus, Edit2, Trash2, Save, X, AlertTriangle, MoreVertical } from 'lucide-react';
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

// Custom Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  categoryName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  categoryName,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Category</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">This action cannot be undone</p>
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Are you sure you want to delete the category <span className="font-semibold">"{categoryName}"</span>? 
          This will remove the category permanently.
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Settings({ addToast }: SettingsProps) {
  const authStore = useAuthStore();
  const { user } = authStore;
  const isAdmin = authStore?.isAdmin ?? false;
  const { categories, loadData, updateCategory, deleteCategory, syncInProgress } = useFinanceStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // Category dropdown state
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const currency = 'NGN'; // Hardcoded to Naira

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

  const saveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          currency: 'NGN', // Always save as NGN
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
        currency: 'NGN'
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

  // Updated delete function to show custom modal instead of window.confirm
  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    setCategoryToDelete({ id: categoryId, name: category.name });
    setShowDeleteModal(true);
  };

  // Actual delete function called after confirmation
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id);

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
    } finally {
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  // Cancel delete function
  const cancelDeleteCategory = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
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

  // Show loading overlay if sync is in progress
  if (syncInProgress) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200 relative">
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Syncing data...</p>
          </div>
        </div>
        <div className="opacity-50 pointer-events-none">
          {/* Render the normal content but disabled */}
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
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
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {isAdmin ? 'Manage administrator information' : 'Manage your profile information'}
            </p>
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
            <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm sm:text-base">
              Nigerian Naira (₦)
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Amounts will be displayed in Nigerian Naira
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
      {isAdmin && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Categories</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Manage transaction categories
              </p>
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
                      </div>
                      {/* Category Actions Dropdown */}
                      <div className="relative ml-2">
                        <button
                          onClick={() => setActiveCategoryDropdown(activeCategoryDropdown === category.id ? null : category.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeCategoryDropdown === category.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveCategoryDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                              <button
                                onClick={() => {
                                  startEditCategory(category);
                                  setActiveCategoryDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Category
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteCategory(category.id);
                                  setActiveCategoryDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Category
                              </button>
                            </div>
                          </>
                        )}
                        </div>
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
                      </div>
                      {/* Category Actions Dropdown */}
                      <div className="relative ml-2">
                        <button
                          onClick={() => setActiveCategoryDropdown(activeCategoryDropdown === category.id ? null : category.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeCategoryDropdown === category.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveCategoryDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                              <button
                                onClick={() => {
                                  startEditCategory(category);
                                  setActiveCategoryDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Category
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteCategory(category.id);
                                  setActiveCategoryDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Category
                              </button>
                            </div>
                          </>
                        )}
                        </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Create Category Modal */}
      {showCreateModal && isAdmin && (
        <CreateCategoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCategoryCreated}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        categoryName={categoryToDelete?.name || ''}
        onConfirm={confirmDeleteCategory}
        onCancel={cancelDeleteCategory}
      />
    </div>
  );
}