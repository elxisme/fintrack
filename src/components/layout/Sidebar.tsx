import React from 'react';
import { Home, CreditCard, TrendingUp, Settings, LogOut, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

export default function Sidebar({ activeTab, onTabChange, isAdmin }: SidebarProps) {
  const { signOut } = useAuthStore();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    ...(isAdmin ? [{ id: 'accounts', name: 'Accounts', icon: CreditCard }] : []),
    { id: 'transactions', name: 'Transactions', icon: TrendingUp },
    ...(isAdmin ? [{ id: 'settings', name: 'Settings', icon: Settings }] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">ChurchTrack</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4">
        <ul className="space-y-1 sm:space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                  <span className="font-medium text-sm sm:text-base">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Version Info */}
      <div className="px-3 sm:px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          CoCK ver. 1.2.0 by{' '}
          <a 
            href="https://elxis.com.ng" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            eLxis
          </a>
        </p>
        {isAdmin && (
          <p className="text-xs text-blue-600 dark:text-blue-400 text-center mt-1 font-medium">
            Administrator Access
          </p>
        )}
      </div>

      {/* Sign Out */}
      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 rounded-lg transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform duration-200" />
          <span className="font-medium text-sm sm:text-base">Sign Out</span>
        </button>
      </div>
    </div>
  );
}