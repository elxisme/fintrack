import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdatePromptProps {
  isAppInstalled: boolean;
  newServiceWorker: ServiceWorker | null;
}

export default function UpdatePrompt({ isAppInstalled, newServiceWorker }: UpdatePromptProps) {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (newServiceWorker) {
      setShowUpdate(true);
    }
  }, [newServiceWorker]);

  const handleUpdate = () => {
    if (newServiceWorker) {
      newServiceWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdate(false);
      // Reload the page to apply the update
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  // Only show update prompt if app is installed and there's a new service worker
  if (!showUpdate || !isAppInstalled || !newServiceWorker) return null;

  return (
    <div className="fixed top-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Update Available
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              A new version of FinTrack is ready to install
            </p>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleUpdate}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Update Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}