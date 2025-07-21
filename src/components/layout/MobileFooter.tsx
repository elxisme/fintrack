import React from 'react';
import { Home, Plus, Settings, TrendingUp, LogOut, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';

interface MobileFooterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddTransaction: () => void;
  isAdmin: boolean;
}

export default function MobileFooter({ activeTab, onTabChange, onAddTransaction, isAdmin }: MobileFooterProps) {
  const { signOut } = useAuthStore();

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    ...(isAdmin ? [{ id: 'accounts', icon: CreditCard, label: 'Accounts' }] : []),
    ...(isAdmin ? [{ id: 'add', icon: Plus, label: 'Add', isSpecial: true }] : []),
    { id: 'transactions', icon: TrendingUp, label: 'History' },
    { id: 'logout', icon: LogOut, label: 'Logout', isLogout: true }
  ];

  const handleItemClick = (item: any) => {
    if (item.isSpecial) {
      onAddTransaction();
    } else if (item.isLogout) {
      signOut();
    } else {
      onTabChange(item.id);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40 lg:hidden transition-colors duration-200">
      <div className="flex items-center justify-around py-2 px-2 pb-6 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !item.isSpecial && !item.isLogout;
          
          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex flex-col items-center justify-center py-2 px-2 min-w-0 flex-1 transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : item.isLogout
                  ? 'text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
              <span className={`text-[10px] font-medium truncate ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}