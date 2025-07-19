import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300'
  };

  const iconColors = {
    success: 'text-green-500 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    info: 'text-blue-500 dark:text-blue-400'
  };

  const Icon = icons[type];

  return (
    <div className={`max-w-xs sm:max-w-sm w-full ${colors[type]} border rounded-lg shadow-lg p-3 sm:p-4 pointer-events-auto transition-colors duration-200`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColors[type]}`} />
        </div>
        <div className="ml-2 sm:ml-3 w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {message && (
            <p className="mt-1 text-xs sm:text-sm opacity-90">{message}</p>
          )}
        </div>
        <div className="ml-2 sm:ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onClose(id)}
            className="inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}