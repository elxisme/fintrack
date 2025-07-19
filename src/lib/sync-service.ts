import { supabase } from './supabase';
import { 
  getSyncQueue, 
  clearSyncQueue, 
  markAsSynced,
  saveCategoriesOffline,
  initDB,
  deleteSyncQueueItem,
  saveAccountOffline,
  saveTransactionOffline
} from './offline-storage';

class SyncService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private syncCallbacks: (() => void)[] = [];
  private dbInitialized = false;

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.sync();
      }
    }, 30000);
  }

  public async sync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    
    try {
      // Check if user is authenticated before attempting sync
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('No authenticated user, skipping sync');
        return;
      }

      console.log('Starting sync for user:', user.id);

      // First sync FROM server (download data)
      await this.syncFromServer(user.id);
      
      // Then sync TO server (upload local changes)
      await this.syncToServer();
      
      this.notifyCallbacks();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncFromServer(userId: string): Promise<void> {
    try {
      console.log('Syncing data from server for user:', userId);

      // Sync categories (default categories)
      await this.syncCategoriesFromServer();

      // Sync user's accounts from server
      await this.syncAccountsFromServer(userId);

      // Sync user's transactions from server
      await this.syncTransactionsFromServer(userId);

      this.dbInitialized = true;
      console.log('Server sync completed successfully');
    } catch (error) {
      console.error('Failed to sync from server:', error);
      // Fallback to offline categories
      await this.createDefaultCategoriesOffline();
    }
  }

  private async syncAccountsFromServer(userId: string): Promise<void> {
    try {
      console.log('Fetching accounts from server for user:', userId);
      
      const { data: serverAccounts, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('Accounts table does not exist in database. Please apply migrations to your Supabase project.');
        } else {
          console.error('Error syncing accounts from server:', error);
        }
        return;
      }

      if (serverAccounts && serverAccounts.length > 0) {
        console.log('Found accounts on server:', serverAccounts.length);
        
        const db = await initDB();
        
        // Get existing local accounts
        const localAccounts = await db.getAllFromIndex('accounts', 'by-user', userId);
        const localAccountsMap = new Map(localAccounts.map(acc => [acc.id, acc]));
        
        for (const serverAccount of serverAccounts) {
          const localAccount = localAccountsMap.get(serverAccount.id);
          
          if (!localAccount) {
            // New account from server - add it locally
            await db.put('accounts', {
              ...serverAccount,
              is_synced: true
            });
            console.log('Added new account from server:', serverAccount.name);
          } else {
            // Account exists locally - check which is newer
            const serverTime = new Date(serverAccount.updated_at).getTime();
            const localTime = new Date(localAccount.updated_at).getTime();
            
            if (serverTime > localTime && localAccount.is_synced) {
              // Server version is newer and local is synced - update local
              await db.put('accounts', {
                ...serverAccount,
                is_synced: true
              });
              console.log('Updated account from server (newer):', serverAccount.name);
            } else if (!localAccount.is_synced) {
              // Local has unsynced changes - keep local version
              console.log('Keeping local account (has unsynced changes):', localAccount.name);
            }
          }
        }
      } else {
        console.log('No accounts found on server for user:', userId);
      }
    } catch (error) {
      console.error('Failed to sync accounts from server:', error);
    }
  }

  private async syncTransactionsFromServer(userId: string): Promise<void> {
    try {
      console.log('Fetching transactions from server for user:', userId);
      
      // Fetch transactions for all user's accounts using explicit relationship specification
      // Use the account_id foreign key relationship to avoid ambiguity
      const { data: serverTransactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          accounts!transactions_account_id_fkey!inner(user_id)
        `)
        .eq('accounts.user_id', userId);
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('Transactions table does not exist in database. Please apply migrations to your Supabase project.');
        } else {
          console.error('Error syncing transactions from server:', error);
        }
        return;
      }

      if (serverTransactions && serverTransactions.length > 0) {
        console.log('Found transactions on server:', serverTransactions.length);
        
        const db = await initDB();
        
        // Get existing local transactions
        const localTransactions = await db.getAll('transactions');
        const localTransactionsMap = new Map(localTransactions.map(trans => [trans.id, trans]));
        
        for (const serverTransaction of serverTransactions) {
          // Remove the joined accounts data before storing
          const { accounts, ...transactionData } = serverTransaction as any;
          
          const localTransaction = localTransactionsMap.get(transactionData.id);
          
          if (!localTransaction) {
            // New transaction from server - add it locally
            await db.put('transactions', {
              ...transactionData,
              is_synced: true,
              sync_status: 'synced'
            });
            console.log('Added new transaction from server:', transactionData.description || 'Untitled');
          } else {
            // Transaction exists locally - check which is newer
            const serverTime = new Date(transactionData.updated_at).getTime();
            const localTime = new Date(localTransaction.updated_at).getTime();
            
            if (serverTime > localTime && localTransaction.is_synced) {
              // Server version is newer and local is synced - update local
              await db.put('transactions', {
                ...transactionData,
                is_synced: true,
                sync_status: 'synced'
              });
              console.log('Updated transaction from server (newer):', transactionData.description || 'Untitled');
            } else if (!localTransaction.is_synced || localTransaction.sync_status === 'pending') {
              // Local has unsynced changes - keep local version
              console.log('Keeping local transaction (has unsynced changes):', localTransaction.description || 'Untitled');
            }
          }
        }
      } else {
        console.log('No transactions found on server for user:', userId);
      }
    } catch (error) {
      console.error('Failed to sync transactions from server:', error);
    }
  }

  private async syncToServer(): Promise<void> {
    // Get current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Failed to get current user for sync:', userError);
      return;
    }
    
    if (!user) {
      console.log('No authenticated user found, skipping server sync');
      return;
    }

    console.log('Syncing to server for user:', user.id);

    const syncQueue = await getSyncQueue();
    console.log('Syncing to server, queue items:', syncQueue.length);
    
    // Initialize database to access local data for validation
    const db = await initDB();
    
    for (const item of syncQueue) {
      try {
        // Filter sync queue by current user
        let shouldSync = false;
        
        if (item.table === 'accounts') {
          // For accounts, check if user_id matches current user
          if (item.data.user_id === user.id) {
            shouldSync = true;
          } else {
            console.warn(`Skipping account sync - user_id mismatch. Expected: ${user.id}, Got: ${item.data.user_id}`);
          }
        } else if (item.table === 'transactions') {
          // For transactions, check if the associated account belongs to current user
          try {
            const account = await db.get('accounts', item.data.account_id);
            if (account && account.user_id === user.id) {
              shouldSync = true;
            } else {
              console.warn(`Skipping transaction sync - account not found or user_id mismatch. Account ID: ${item.data.account_id}, Expected user: ${user.id}`);
            }
          } catch (dbError) {
            console.error('Error checking account ownership for transaction:', dbError);
          }
        } else if (item.table === 'categories') {
          // For categories, check if user_id matches current user
          if (item.data.user_id === user.id) {
            shouldSync = true;
          } else {
            console.warn(`Skipping category sync - user_id mismatch. Expected: ${user.id}, Got: ${item.data.user_id}`);
          }
        }

        if (!shouldSync) {
          // Remove invalid items from sync queue
          await deleteSyncQueueItem(item.id);
          continue;
        }

        if (item.table === 'accounts') {
          // Remove offline-only properties before sending to Supabase
          const { is_synced, ...accountData } = item.data;
          
          if (item.action === 'create') {
            console.log('Creating account:', accountData.name, 'for user:', user.id);
            const { error } = await supabase
              .from('accounts')
              .insert(accountData);
            
            if (error) {
              if (error.code === '42501') {
                console.error('RLS Policy Violation for account creation:', {
                  error,
                  accountData,
                  currentUserId: user.id,
                  accountUserId: accountData.user_id
                });
              } else if (error.code === '42P01') {
                console.error('Database table does not exist. Please apply migrations to your Supabase project.');
              } else {
                console.error('Supabase error creating account:', error);
              }
            } else {
              console.log('Account created successfully, marking as synced');
              await markAsSynced('accounts', item.data.id);
              await deleteSyncQueueItem(item.id);
            }
          } else if (item.action === 'update') {
            console.log('Updating account:', accountData.name, 'for user:', user.id);
            const { error } = await supabase
              .from('accounts')
              .update(accountData)
              .eq('id', accountData.id);
            
            if (error) {
              if (error.code === '42501') {
                console.error('RLS Policy Violation for account update:', {
                  error,
                  accountData,
                  currentUserId: user.id,
                  accountUserId: accountData.user_id
                });
              } else if (error.code === '42P01') {
                console.error('Database table does not exist. Please apply migrations to your Supabase project.');
              } else {
                console.error('Supabase error updating account:', error);
              }
            } else {
              console.log('Account updated successfully, marking as synced');
              await markAsSynced('accounts', item.data.id);
              await deleteSyncQueueItem(item.id);
            }
          }
        } else if (item.table === 'transactions') {
          // Remove offline-only properties before sending to Supabase
          const { is_synced, ...transactionData } = item.data;
          
          if (item.action === 'create') {
            console.log('Creating transaction:', transactionData.description, 'for account:', transactionData.account_id);
            
            // Set sync_status to 'synced' when inserting to database
            const dataToInsert = {
              ...transactionData,
              sync_status: 'synced'
            };
            
            const { error } = await supabase
              .from('transactions')
              .insert(dataToInsert);
            
            if (error) {
              if (error.code === '42501') {
                // Get account info for detailed logging
                const account = await db.get('accounts', transactionData.account_id);
                console.error('RLS Policy Violation for transaction creation:', {
                  error,
                  transactionData,
                  currentUserId: user.id,
                  accountId: transactionData.account_id,
                  accountUserId: account?.user_id,
                  accountExists: !!account
                });
              } else if (error.code === '42P01') {
                console.error('Database table does not exist. Please apply migrations to your Supabase project.');
              } else {
                console.error('Supabase error creating transaction:', error);
              }
            } else {
              console.log('Transaction created successfully, marking as synced');
              await markAsSynced('transactions', item.data.id);
              await deleteSyncQueueItem(item.id);
            }
          } else if (item.action === 'update') {
            console.log('Updating transaction:', transactionData.description, 'for account:', transactionData.account_id);
            
            // Set sync_status to 'synced' when updating in database
            const dataToUpdate = {
              ...transactionData,
              sync_status: 'synced'
            };
            
            const { error } = await supabase
              .from('transactions')
              .update(dataToUpdate)
              .eq('id', transactionData.id);
            
            if (error) {
              if (error.code === '42501') {
                const account = await db.get('accounts', transactionData.account_id);
                console.error('RLS Policy Violation for transaction update:', {
                  error,
                  transactionData,
                  currentUserId: user.id,
                  accountId: transactionData.account_id,
                  accountUserId: account?.user_id,
                  accountExists: !!account
                });
              } else if (error.code === '42P01') {
                console.error('Database table does not exist. Please apply migrations to your Supabase project.');
              } else {
                console.error('Supabase error updating transaction:', error);
              }
            } else {
              console.log('Transaction updated successfully, marking as synced');
              await markAsSynced('transactions', item.data.id);
              await deleteSyncQueueItem(item.id);
            }
          }
        } else if (item.table === 'categories') {
          // Remove offline-only properties before sending to Supabase
          const { is_synced, ...categoryData } = item.data;
          
          if (item.action === 'create') {
            console.log('Creating category:', categoryData.name, 'for user:', user.id);
            const { error } = await supabase
              .from('categories')
              .insert(categoryData);
            
            if (error) {
              if (error.code === '42501') {
                console.error('RLS Policy Violation for category creation:', {
                  error,
                  categoryData,
                  currentUserId: user.id,
                  categoryUserId: categoryData.user_id
                });
              } else if (error.code === '42P01') {
                console.error('Database table does not exist. Please apply migrations to your Supabase project.');
              } else {
                console.error('Supabase error creating category:', error);
              }
            } else {
              console.log('Category created successfully, marking as synced');
              await markAsSynced('categories', item.data.id);
              await deleteSyncQueueItem(item.id);
            }
          } else if (item.action === 'update') {
            console.log('Updating category:', categoryData.name, 'for user:', user.id);
            const { error } = await supabase
              .from('categories')
              .update(categoryData)
              .eq('id', categoryData.id);
            
            if (error) {
              if (error.code === '42501') {
                console.error('RLS Policy Violation for category update:', {
                  error,
                  categoryData,
                  currentUserId: user.id,
                  categoryUserId: categoryData.user_id
                });
              } else if (error.code === '42P01') {
                console.error('Database table does not exist. Please apply migrations to your Supabase project.');
              } else {
                console.error('Supabase error updating category:', error);
              }
            } else {
              console.log('Category updated successfully, marking as synced');
              await markAsSynced('categories', item.data.id);
              await deleteSyncQueueItem(item.id);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to sync ${item.table} ${item.action}:`, error);
      }
    }
  }

  private async syncCategoriesFromServer(): Promise<void> {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) {
        if (error.code === '42P01') {
          console.warn('Categories table does not exist in database. Please apply migrations to your Supabase project.');
          await this.createDefaultCategoriesOffline();
        } else {
          console.error('Error syncing categories from server:', error);
        }
      } else if (categories) {
        console.log('Synced categories from server:', categories.length);
        await saveCategoriesOffline(categories.map(cat => ({
          ...cat,
          is_synced: true
        })));
      }
    } catch (error) {
      console.error('Failed to sync categories from server:', error);
      await this.createDefaultCategoriesOffline();
    }
  }

  private async createDefaultCategoriesOffline(): Promise<void> {
    try {
      const defaultCategories = [
        // Income categories
        { id: 'default-salary', user_id: null, name: 'Salary', type: 'income', color: '#10b981', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-freelance', user_id: null, name: 'Freelance', type: 'income', color: '#059669', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-investment', user_id: null, name: 'Investment', type: 'income', color: '#047857', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-business', user_id: null, name: 'Business', type: 'income', color: '#065f46', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-other-income', user_id: null, name: 'Other Income', type: 'income', color: '#064e3b', created_at: new Date().toISOString(), is_synced: false },
        
        // Expense categories
        { id: 'default-food', user_id: null, name: 'Food & Dining', type: 'expense', color: '#ef4444', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-transport', user_id: null, name: 'Transportation', type: 'expense', color: '#dc2626', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-shopping', user_id: null, name: 'Shopping', type: 'expense', color: '#b91c1c', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-bills', user_id: null, name: 'Bills & Utilities', type: 'expense', color: '#991b1b', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-entertainment', user_id: null, name: 'Entertainment', type: 'expense', color: '#7c2d12', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-healthcare', user_id: null, name: 'Healthcare', type: 'expense', color: '#92400e', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-travel', user_id: null, name: 'Travel', type: 'expense', color: '#a16207', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-education', user_id: null, name: 'Education', type: 'expense', color: '#a3a3a3', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-personal', user_id: null, name: 'Personal Care', type: 'expense', color: '#737373', created_at: new Date().toISOString(), is_synced: false },
        { id: 'default-other-expense', user_id: null, name: 'Other Expense', type: 'expense', color: '#525252', created_at: new Date().toISOString(), is_synced: false }
      ];

      await saveCategoriesOffline(defaultCategories);
      console.log('Created default categories offline');
    } catch (error) {
      console.error('Failed to create default categories offline:', error);
    }
  }

  public onSync(callback: () => void) {
    this.syncCallbacks.push(callback);
  }

  private notifyCallbacks() {
    this.syncCallbacks.forEach(callback => callback());
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      dbInitialized: this.dbInitialized
    };
  }
}

export const syncService = new SyncService();