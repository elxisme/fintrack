import React, { useState } from 'react';
import { Plus, CreditCard, Wallet, Building, Banknote, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import CreateAccountModal from './CreateAccountModal';
import EditAccountModal from './EditAccountModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Account } from '../../lib/offline-storage';
import { useAuthStore } from '../../store/auth-store';


interface AccountsListProps {
  addToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string }) => void;
}

export default function AccountsList({ addToast }: AccountsListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const { accounts, deleteAccount } = useFinanceStore();
  const authStore = useAuthStore();
  const isAdmin = authStore?.isAdmin ?? false;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return Building;
      case 'savings':
        return Banknote;
      case 'credit':
        return CreditCard;
      case 'cash':
        return Wallet;
      default:
        return CreditCard;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'checking':
        return 'blue';
      case 'savings':
        return 'green';
      case 'credit':
        return 'red';
      case 'cash':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${new Intl.NumberFormat('en-NG').format(amount)}`;
  };

  const handleAccountCreated = () => {
    setShowCreateModal(false);
    addToast({
      type: 'success',
      title: 'Account created'
    });
  };

  const handleAccountUpdated = () => {
    setEditingAccount(null);
    addToast({
      type: 'success',
      title: 'Account updated'
    });
  };

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;

    try {
      await deleteAccount(deletingAccount.id);
      setDeletingAccount(null);
      addToast({
        type: 'success',
        title: 'Account deleted'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete failed'
      });
    }
  };

  const toggleDropdown = (accountId: string) => {
    setActiveDropdown(activeDropdown === accountId ? null : accountId);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Accounts</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {isAdmin ? 'Manage church financial accounts' : 'View church financial accounts'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Account
          </button>
        )}
      </div>

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.type);
            const color = getAccountColor(account.type);
            
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700',
              green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700',
              red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700',
              gray: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600'
            };

            return (
              <div
                key={account.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-200 relative group hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!account.is_synced && (
                      <div className="w-3 h-3 bg-orange-400 rounded-full" title="Not synced" />
                    )}
                    
                    {/* Actions Dropdown */}
                    {isAdmin && (
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(account.id)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeDropdown === account.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                              <button
                                onClick={() => {
                                  setEditingAccount(account);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Account
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingAccount(account);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {account.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 capitalize mb-3">
                    {account.type} Account
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(account.current_balance)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Initial: {formatCurrency(account.initial_balance)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No accounts yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm sm:text-base">
            {isAdmin ? 'Create your first account to start tracking church finances' : 'No church accounts have been created yet'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 inline-flex items-center gap-2 text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Account
            </button>
          )}
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && isAdmin && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAccountCreated}
        />
      )}

      {/* Edit Account Modal */}
      {editingAccount && isAdmin && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSuccess={handleAccountUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingAccount}
        title="Delete Account"
        message={`Are you sure you want to delete "${deletingAccount?.name}"? This will also delete all associated transactions. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeletingAccount(null)}
      />
    </div>
  );
}