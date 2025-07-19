import React from 'react';
import { Wifi, WifiOff, RefreshCw, Menu, Moon, Sun } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { isOnline, syncInProgress } = useFinanceStore();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Sync Status */}
          <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
            isOnline 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}>
            {isOnline ? (
              <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          
          {syncInProgress && (
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-medium">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              <span className="hidden sm:inline">Syncing...</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}