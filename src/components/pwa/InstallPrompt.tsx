import React from 'react';
import { Download, X, Smartphone, Monitor, Clock, Eye } from 'lucide-react';

interface InstallPromptProps {
  pwaHook: {
    showInstallPrompt: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    canInstall: boolean;
    installApp: () => Promise<boolean>;
    dismissInstallPrompt: () => void;
    timeSpent: number;
    pagesVisited: number;
    engagementMet: boolean;
  };
}

export default function InstallPrompt({ pwaHook }: InstallPromptProps) {
  const { 
    showInstallPrompt, 
    isIOS, 
    isAndroid, 
    canInstall, 
    installApp, 
    dismissInstallPrompt,
    timeSpent,
    pagesVisited,
    engagementMet
  } = pwaHook;

  if (!showInstallPrompt) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await installApp();
    }
  };

  const getInstallInstructions = () => {
    if (isIOS) {
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          <p>To install: Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></p>
        </div>
      );
    }
    return null;
  };

  const getBenefits = () => {
    return [
      'Instant access from your home screen',
      'Works offline when you\'re not connected',
      'Faster loading and smoother experience',
      'No browser bars for distraction-free use'
    ];
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            {isAndroid || (!isIOS && window.innerWidth < 768) ? (
              <Smartphone className="w-6 h-6 text-white" />
            ) : (
              <Monitor className="w-6 h-6 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Install FinTrack App
              </h3>
              <button
                onClick={dismissInstallPrompt}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Get the full app experience with these benefits:
            </p>
            
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
              {getBenefits().slice(0, 2).map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0"></div>
                  {benefit}
                </li>
              ))}
            </ul>

            {/* Engagement indicators */}
            <div className="flex items-center gap-3 mb-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeSpent}s spent</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{pagesVisited} pages viewed</span>
              </div>
            </div>
            
            {getInstallInstructions()}
          </div>
        </div>
        
        {canInstall && !isIOS && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
            <button
              onClick={dismissInstallPrompt}
              className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Later
            </button>
          </div>
        )}

        {isIOS && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={dismissInstallPrompt}
              className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}