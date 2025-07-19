import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/auth-store';
import { useFinanceStore } from './store/finance-store';
import { initDB } from './lib/offline-storage';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import { usePWA } from './hooks/usePWA';
import AuthForm from './components/auth/AuthForm';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileFooter from './components/layout/MobileFooter';
import Dashboard from './components/dashboard/Dashboard';
import AccountsList from './components/accounts/AccountsList';
import TransactionsList from './components/transactions/TransactionsList';
import Settings from './components/settings/Settings';
import CreateTransactionModal from './components/transactions/CreateTransactionModal';
import ToastContainer from './components/ui/ToastContainer';
import InstallPrompt from './components/pwa/InstallPrompt';
import UpdatePrompt from './components/pwa/UpdatePrompt';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const { user, loading, initialize, isAdmin } = useAuthStore();
  const { updateSyncStatus } = useFinanceStore();
  const { toasts, addToast, removeToast } = useToast();
  const { isDark } = useTheme();
  
  // Pass activeTab to usePWA hook for page tracking
  const pwaHook = usePWA(activeTab);

  useEffect(() => {
    initialize();
    initDB();
  }, [initialize]);

  useEffect(() => {
    // Update sync status periodically
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, [updateSyncStatus]);

  // Handle URL parameters for PWA shortcuts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const tab = urlParams.get('tab');

    if (action === 'add-transaction' && user) {
      setShowCreateTransaction(true);
    }

    if (tab && user) {
      setActiveTab(tab);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <InstallPrompt pwaHook={pwaHook} />
        <UpdatePrompt isAppInstalled={pwaHook.isInstalled} newServiceWorker={pwaHook.newWorker} />
      </>
    );
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'accounts':
        return 'Accounts';
      case 'transactions':
        return 'Transactions';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const renderActiveTab = () => {
    const props = { addToast };
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard {...props} />;
      case 'accounts':
        return <AccountsList {...props} />;
      case 'transactions':
        return <TransactionsList {...props} />;
      case 'settings':
        return <Settings {...props} />;
      default:
        return <Dashboard {...props} />;
    }
  };

  const handleTransactionCreated = () => {
    setShowCreateTransaction(false);
    addToast({
      type: 'success',
      title: 'Transaction added'
    });
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }}
          isAdmin={isAdmin}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header 
          title={getPageTitle()} 
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto relative">
          <div className="min-h-full">
            {renderActiveTab()}
          </div>
          
          {/* Version Footer - Positioned at the end of content */}
          <div className="px-4 sm:px-6 py-3 mb-16 lg:mb-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              ChurchTrack ver. 1.2.0 by{' '}
              <a 
                href="https://elxis.com.ng" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                eLxis
              </a>
            </p>
          </div>
        </main>
      </div>

      {/* Mobile Footer Navigation */}
      <MobileFooter
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddTransaction={() => setShowCreateTransaction(true)}
        isAdmin={isAdmin}
      />

      {/* Create Transaction Modal */}
      {showCreateTransaction && isAdmin && (
        <CreateTransactionModal
          onClose={() => setShowCreateTransaction(false)}
          onSuccess={handleTransactionCreated}
        />
      )}

      {/* PWA Components */}
      <InstallPrompt pwaHook={pwaHook} />
      <UpdatePrompt isAppInstalled={pwaHook.isInstalled} newServiceWorker={pwaHook.newWorker} />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;