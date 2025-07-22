import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash';
  initial_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}

export interface Transaction {
  id: string;
  account_id: string;
  target_account_id?: string | null; // Added for transfer transactions
  category_id: string | null;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  created_at: string;
  updated_at: string;
  sync_status: 'synced' | 'pending' | 'conflict';
  is_synced: boolean;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: 'income' | 'expense';
  color: string;
  created_at: string;
  is_synced: boolean;
}

interface FinanceDB extends DBSchema {
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-user': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-account': string; 'by-sync': boolean };
  };
  categories: {
    key: string;
    value: Category;
    indexes: { 'by-user': string | null };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      table: string;
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<FinanceDB>;

export async function initDB(): Promise<IDBPDatabase<FinanceDB>> {
  if (db) return db;

  db = await openDB<FinanceDB>('FinanceTracker', 1, {
    upgrade(db) {
      // Accounts store
      const accountStore = db.createObjectStore('accounts', { keyPath: 'id' });
      accountStore.createIndex('by-user', 'user_id');

      // Transactions store
      const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
      transactionStore.createIndex('by-account', 'account_id');
      transactionStore.createIndex('by-sync', 'is_synced');

      // Categories store
      const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
      categoryStore.createIndex('by-user', 'user_id');

      // Sync queue store
      db.createObjectStore('sync_queue', { keyPath: 'id' });
    },
  });

  return db;
}

// Account operations
export async function saveAccountOffline(account: Account): Promise<void> {
  const database = await initDB();
  await database.put('accounts', { ...account, is_synced: false });
  
  // Add to sync queue
  await database.put('sync_queue', {
    id: `account_${account.id}_${Date.now()}`,
    table: 'accounts',
    action: 'create',
    data: account,
    timestamp: Date.now(),
  });
}

export async function getAccountsOffline(userId: string): Promise<Account[]> {
  const database = await initDB();
  // If userId is empty, return all accounts (for viewers to see all church accounts)
  if (!userId) {
    return database.getAll('accounts');
  }
  return database.getAllFromIndex('accounts', 'by-user', userId);
}

export async function updateAccountOffline(account: Account): Promise<void> {
  const database = await initDB();
  await database.put('accounts', { ...account, is_synced: false });
  
  // Add to sync queue
  await database.put('sync_queue', {
    id: `account_${account.id}_${Date.now()}`,
    table: 'accounts',
    action: 'update',
    data: account,
    timestamp: Date.now(),
  });
}

// Transaction operations
export async function saveTransactionOffline(transaction: Transaction): Promise<void> {
  const database = await initDB();
  await database.put('transactions', { ...transaction, is_synced: false, sync_status: 'pending' });
  
  // Add to sync queue
  await database.put('sync_queue', {
    id: `transaction_${transaction.id}_${Date.now()}`,
    table: 'transactions',
    action: 'create',
    data: transaction,
    timestamp: Date.now(),
  });
}

export async function getTransactionsOffline(accountId?: string): Promise<Transaction[]> {
  const database = await initDB();
  if (accountId) {
    return database.getAllFromIndex('transactions', 'by-account', accountId);
  }
  return database.getAll('transactions');
}

export async function updateTransactionOffline(transaction: Transaction): Promise<void> {
  const database = await initDB();
  await database.put('transactions', { ...transaction, is_synced: false, sync_status: 'pending' });
  
  // Add to sync queue
  await database.put('sync_queue', {
    id: `transaction_${transaction.id}_${Date.now()}`,
    table: 'transactions',
    action: 'update',
    data: transaction,
    timestamp: Date.now(),
  });
}

// Category operations
export async function saveCategoriesOffline(categories: Category[]): Promise<void> {
  const database = await initDB();
  const tx = database.transaction('categories', 'readwrite');
  for (const category of categories) {
    await tx.store.put({ ...category, is_synced: true });
  }
  await tx.done;
}

export async function getCategoriesOffline(): Promise<Category[]> {
  const database = await initDB();
  return database.getAll('categories');
}

// Sync operations
export async function getSyncQueue(): Promise<any[]> {
  const database = await initDB();
  return database.getAll('sync_queue');
}

export async function clearSyncQueue(): Promise<void> {
  const database = await initDB();
  await database.clear('sync_queue');
}

export async function deleteSyncQueueItem(id: string): Promise<void> {
  const database = await initDB();
  await database.delete('sync_queue', id);
}

export async function markAsSynced(table: string, id: string): Promise<void> {
  const database = await initDB();
  
  if (table === 'accounts') {
    const account = await database.get('accounts', id);
    if (account) {
      await database.put('accounts', { ...account, is_synced: true });
    }
  } else if (table === 'transactions') {
    const transaction = await database.get('transactions', id);
    if (transaction) {
      await database.put('transactions', { ...transaction, is_synced: true, sync_status: 'synced' });
    }
  } else if (table === 'categories') {
    const category = await database.get('categories', id);
    if (category) {
      await database.put('categories', { ...category, is_synced: true });
    }
  }
}