import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { 
  Account, 
  Transaction, 
  Category,
  saveAccountOffline,
  getAccountsOffline,
  updateAccountOffline,
  saveTransactionOffline,
  getTransactionsOffline,
  updateTransactionOffline,
  getCategoriesOffline,
  initDB
} from '../lib/offline-storage';
import { syncService } from '../lib/sync-service';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  isOnline: boolean;
  syncInProgress: boolean;
  exchangeRate: number | null;
  
  // Actions
  loadData: (userId: string) => Promise<void>;
  reloadDataFromLocal: (userId: string) => Promise<void>;
  createAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'is_synced'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  
  createTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'is_synced' | 'sync_status'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  
  createCategory: (category: Omit<Category, 'id' | 'created_at' | 'is_synced'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  
  setExchangeRate: (rate: number | null) => void;
  updateSyncStatus: () => void;
}

// Helper function to get exchange rate from localStorage
const getStoredExchangeRate = (): number | null => {
  try {
    const stored = localStorage.getItem('fintrack-exchange-rate');
    return stored ? parseFloat(stored) : null;
  } catch {
    return null;
  }
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: [],
  isOnline: navigator.onLine,
  syncInProgress: false,
  exchangeRate: getStoredExchangeRate(),

  loadData: async (userId: string) => {
    try {
      console.log('Loading data for authenticated user:', userId);
      
      // Always load from offline storage first for immediate UI response
      // Load all data since viewers should see all church financial data
      const [offlineAccounts, offlineTransactions, offlineCategories] = await Promise.all([
        getAccountsOffline(''), // Load all accounts regardless of user_id
        getTransactionsOffline(),
        getCategoriesOffline()
      ]);

      console.log('Loaded from offline storage:', {
        accounts: offlineAccounts.length,
        transactions: offlineTransactions.length,
        categories: offlineCategories.length
      });

      // Update UI immediately with local data
      set({
        accounts: offlineAccounts,
        transactions: offlineTransactions,
        categories: offlineCategories
      });

      // If online, sync with server to get latest data
      if (navigator.onLine) {
        console.log('Online - initiating sync to get latest data...');
        
        // Trigger sync which will download server data and upload local changes
        await syncService.sync();
        
        // After sync, reload data from local storage to include any new data from server
        console.log('Sync completed, reloading data from local storage...');
        await get().reloadDataFromLocal(userId);
      } else {
        console.log('Offline - using local data only');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  },

  reloadDataFromLocal: async (userId: string) => {
    try {
      console.log('Reloading data from local storage for authenticated user:', userId);
      
      // Load all data since viewers should see all church financial data
      const [offlineAccounts, offlineTransactions, offlineCategories] = await Promise.all([
        getAccountsOffline(''), // Load all accounts regardless of user_id
        getTransactionsOffline(),
        getCategoriesOffline()
      ]);

      console.log('Reloaded from offline storage:', {
        accounts: offlineAccounts.length,
        transactions: offlineTransactions.length,
        categories: offlineCategories.length
      });

      set({
        accounts: offlineAccounts,
        transactions: offlineTransactions,
        categories: offlineCategories
      });
    } catch (error) {
      console.error('Error reloading data from local storage:', error);
    }
  },

  createAccount: async (accountData) => {
    const account: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_synced: false
    };

    // Save offline first
    await saveAccountOffline(account);
    
    // Update local state immediately
    set(state => ({
      accounts: [...state.accounts, account]
    }));

    // Try to sync if online
    if (navigator.onLine) {
      syncService.sync();
    }
  },

  updateAccount: async (account) => {
    const updatedAccount = {
      ...account,
      updated_at: new Date().toISOString(),
      is_synced: false
    };

    await updateAccountOffline(updatedAccount);
    
    set(state => ({
      accounts: state.accounts.map(acc => 
        acc.id === account.id ? updatedAccount : acc
      )
    }));

    if (navigator.onLine) {
      syncService.sync();
    }
  },

  deleteAccount: async (accountId) => {
    try {
      const db = await initDB();
      const state = get();
      
      // Find the account to delete
      const accountToDelete = state.accounts.find(acc => acc.id === accountId);
      if (!accountToDelete) {
        throw new Error('Account not found');
      }

      // Delete associated transactions first
      const accountTransactions = state.transactions.filter(t => t.account_id === accountId);
      
      // Delete from IndexedDB
      const tx = db.transaction(['accounts', 'transactions'], 'readwrite');
      
      // Delete account
      await tx.objectStore('accounts').delete(accountId);
      
      // Delete associated transactions
      for (const transaction of accountTransactions) {
        await tx.objectStore('transactions').delete(transaction.id);
      }
      
      await tx.done;

      // If online, delete from Supabase
      if (navigator.onLine) {
        // Delete from Supabase (transactions will be deleted by CASCADE)
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('id', accountId);
        
        if (error) {
          console.error('Error deleting account from Supabase:', error);
          // Don't throw error here as offline deletion succeeded
        }
      }

      // Update local state
      set(state => ({
        accounts: state.accounts.filter(acc => acc.id !== accountId),
        transactions: state.transactions.filter(t => t.account_id !== accountId)
      }));

    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  createTransaction: async (transactionData) => {
    const transaction: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_synced: false,
      sync_status: 'pending'
    };

    const state = get();

    // Handle different transaction types
    if (transaction.type === 'transfer') {
      // For transfers, update both source and target accounts
      const sourceAccount = state.accounts.find(acc => acc.id === transaction.account_id);
      const targetAccount = state.accounts.find(acc => acc.id === transaction.target_account_id);

      if (!sourceAccount || !targetAccount) {
        throw new Error('Source or target account not found for transfer');
      }

      // Update source account (subtract amount)
      const updatedSourceAccount = {
        ...sourceAccount,
        current_balance: sourceAccount.current_balance - transaction.amount,
        updated_at: new Date().toISOString(),
        is_synced: false
      };

      // Update target account (add amount)
      const updatedTargetAccount = {
        ...targetAccount,
        current_balance: targetAccount.current_balance + transaction.amount,
        updated_at: new Date().toISOString(),
        is_synced: false
      };

      // Save both accounts
      await updateAccountOffline(updatedSourceAccount);
      await updateAccountOffline(updatedTargetAccount);

      // Update local state for both accounts
      set(state => ({
        accounts: state.accounts.map(acc => {
          if (acc.id === sourceAccount.id) return updatedSourceAccount;
          if (acc.id === targetAccount.id) return updatedTargetAccount;
          return acc;
        })
      }));

    } else {
      // For income/expense, update only the source account
      const account = state.accounts.find(acc => acc.id === transaction.account_id);
      if (account) {
        const balanceChange = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
        const updatedAccount = {
          ...account,
          current_balance: account.current_balance + balanceChange,
          updated_at: new Date().toISOString(),
          is_synced: false
        };
        
        await updateAccountOffline(updatedAccount);
        set(state => ({
          accounts: state.accounts.map(acc => 
            acc.id === account.id ? updatedAccount : acc
          )
        }));
      }
    }

    // Save the transaction
    await saveTransactionOffline(transaction);
    
    set(state => ({
      transactions: [...state.transactions, transaction]
    }));

    if (navigator.onLine) {
      syncService.sync();
    }
  },

  updateTransaction: async (transaction) => {
    const state = get();
    const oldTransaction = state.transactions.find(t => t.id === transaction.id);
    
    if (oldTransaction) {
      // Revert the old transaction's effects first
      if (oldTransaction.type === 'transfer') {
        // Revert transfer: add back to source, subtract from target
        const oldSourceAccount = state.accounts.find(acc => acc.id === oldTransaction.account_id);
        const oldTargetAccount = state.accounts.find(acc => acc.id === oldTransaction.target_account_id);

        if (oldSourceAccount) {
          const revertedSourceAccount = {
            ...oldSourceAccount,
            current_balance: oldSourceAccount.current_balance + oldTransaction.amount,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          await updateAccountOffline(revertedSourceAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === oldSourceAccount.id ? revertedSourceAccount : acc
            )
          }));
        }

        if (oldTargetAccount) {
          const revertedTargetAccount = {
            ...oldTargetAccount,
            current_balance: oldTargetAccount.current_balance - oldTransaction.amount,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          await updateAccountOffline(revertedTargetAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === oldTargetAccount.id ? revertedTargetAccount : acc
            )
          }));
        }
      } else {
        // Revert income/expense
        const oldAccount = state.accounts.find(acc => acc.id === oldTransaction.account_id);
        if (oldAccount) {
          const oldBalanceChange = oldTransaction.type === 'expense' ? oldTransaction.amount : -oldTransaction.amount;
          const revertedAccount = {
            ...oldAccount,
            current_balance: oldAccount.current_balance + oldBalanceChange,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          
          await updateAccountOffline(revertedAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === oldAccount.id ? revertedAccount : acc
            )
          }));
        }
      }

      // Now apply the new transaction's effects
      if (transaction.type === 'transfer') {
        // Apply new transfer
        const newSourceAccount = get().accounts.find(acc => acc.id === transaction.account_id);
        const newTargetAccount = get().accounts.find(acc => acc.id === transaction.target_account_id);

        if (newSourceAccount) {
          const updatedSourceAccount = {
            ...newSourceAccount,
            current_balance: newSourceAccount.current_balance - transaction.amount,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          await updateAccountOffline(updatedSourceAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === newSourceAccount.id ? updatedSourceAccount : acc
            )
          }));
        }

        if (newTargetAccount) {
          const updatedTargetAccount = {
            ...newTargetAccount,
            current_balance: newTargetAccount.current_balance + transaction.amount,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          await updateAccountOffline(updatedTargetAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === newTargetAccount.id ? updatedTargetAccount : acc
            )
          }));
        }
      } else {
        // Apply new income/expense
        const newAccount = get().accounts.find(acc => acc.id === transaction.account_id);
        if (newAccount) {
          const newBalanceChange = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
          const updatedAccount = {
            ...newAccount,
            current_balance: newAccount.current_balance + newBalanceChange,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          
          await updateAccountOffline(updatedAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === newAccount.id ? updatedAccount : acc
            )
          }));
        }
      }
    }

    const updatedTransaction = {
      ...transaction,
      updated_at: new Date().toISOString(),
      is_synced: false,
      sync_status: 'pending' as const
    };

    await updateTransactionOffline(updatedTransaction);
    
    set(state => ({
      transactions: state.transactions.map(trans => 
        trans.id === transaction.id ? updatedTransaction : trans
      )
    }));

    if (navigator.onLine) {
      syncService.sync();
    }
  },

  deleteTransaction: async (transactionId) => {
    try {
      const db = await initDB();
      const state = get();
      
      // Find the transaction to delete
      const transactionToDelete = state.transactions.find(t => t.id === transactionId);
      if (!transactionToDelete) {
        throw new Error('Transaction not found');
      }

      // Revert the transaction's effect on account balances
      if (transactionToDelete.type === 'transfer') {
        // Revert transfer: add back to source, subtract from target
        const sourceAccount = state.accounts.find(acc => acc.id === transactionToDelete.account_id);
        const targetAccount = state.accounts.find(acc => acc.id === transactionToDelete.target_account_id);

        if (sourceAccount) {
          const updatedSourceAccount = {
            ...sourceAccount,
            current_balance: sourceAccount.current_balance + transactionToDelete.amount,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          
          await updateAccountOffline(updatedSourceAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === sourceAccount.id ? updatedSourceAccount : acc
            )
          }));
        }

        if (targetAccount) {
          const updatedTargetAccount = {
            ...targetAccount,
            current_balance: targetAccount.current_balance - transactionToDelete.amount,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          
          await updateAccountOffline(updatedTargetAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === targetAccount.id ? updatedTargetAccount : acc
            )
          }));
        }
      } else {
        // Revert income/expense
        const account = state.accounts.find(acc => acc.id === transactionToDelete.account_id);
        if (account) {
          const balanceChange = transactionToDelete.type === 'expense' ? transactionToDelete.amount : -transactionToDelete.amount;
          const updatedAccount = {
            ...account,
            current_balance: account.current_balance + balanceChange,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          
          await updateAccountOffline(updatedAccount);
          set(state => ({
            accounts: state.accounts.map(acc => 
              acc.id === account.id ? updatedAccount : acc
            )
          }));
        }
      }

      // Delete from IndexedDB
      await db.delete('transactions', transactionId);

      // If online, delete from Supabase
      if (navigator.onLine) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transactionId);
        
        if (error) {
          console.error('Error deleting transaction from Supabase:', error);
          // Don't throw error here as offline deletion succeeded
        }
      }

      // Update local state
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== transactionId)
      }));

    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  createCategory: async (categoryData) => {
    const category: Category = {
      ...categoryData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_synced: false
    };

    try {
      // Save offline first
      const db = await initDB();
      await db.put('categories', category);
      
      // Add to sync queue
      await db.put('sync_queue', {
        id: `category_${category.id}_${Date.now()}`,
        table: 'categories',
        action: 'create',
        data: category,
        timestamp: Date.now(),
      });
      
      // Update local state immediately
      set(state => ({
        categories: [...state.categories, category]
      }));

      // Try to sync if online
      if (navigator.onLine) {
        syncService.sync();
      }
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  updateCategory: async (category) => {
    try {
      const updatedCategory = {
        ...category,
        is_synced: false
      };

      const db = await initDB();
      await db.put('categories', updatedCategory);
      
      // Add to sync queue
      await db.put('sync_queue', {
        id: `category_${category.id}_${Date.now()}`,
        table: 'categories',
        action: 'update',
        data: updatedCategory,
        timestamp: Date.now(),
      });
      
      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === category.id ? updatedCategory : cat
        )
      }));

      if (navigator.onLine) {
        syncService.sync();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const db = await initDB();
      
      // Delete from IndexedDB
      await db.delete('categories', categoryId);

      // If online, delete from Supabase
      if (navigator.onLine) {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);
        
        if (error) {
          console.error('Error deleting category from Supabase:', error);
          // Don't throw error here as offline deletion succeeded
        }
      }

      // Update local state
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== categoryId)
      }));

    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  setExchangeRate: (rate: number | null) => {
    set({ exchangeRate: rate });
    
    // Persist to localStorage
    if (rate !== null) {
      localStorage.setItem('fintrack-exchange-rate', rate.toString());
    } else {
      localStorage.removeItem('fintrack-exchange-rate');
    }
  },

  updateSyncStatus: () => {
    const status = syncService.getStatus();
    set({
      isOnline: status.isOnline,
      syncInProgress: status.syncInProgress
    });
  }
}));

// Setup sync callback to reload data after sync
syncService.onSync(async () => {
  const store = useFinanceStore.getState();
  store.updateSyncStatus();
  
  // Get current user to reload their data
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('Sync completed, reloading data for user:', user.id);
      await store.reloadDataFromLocal(user.id);
    }
  } catch (error) {
    console.error('Error reloading data after sync:', error);
  }
});