import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  showInstallPrompt: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  timeSpent: number;
  pagesVisited: number;
  engagementMet: boolean;
}

export function usePWA(activeTab?: string) {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    showInstallPrompt: false,
    isIOS: false,
    isAndroid: false,
    timeSpent: 0,
    pagesVisited: 0,
    engagementMet: false
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);
  const visitedPagesRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number>(Date.now());
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track time spent on site
  useEffect(() => {
    const updateTimeSpent = () => {
      const currentTime = Date.now();
      const timeSpent = Math.floor((currentTime - startTimeRef.current) / 1000);
      
      setPwaState(prev => ({
        ...prev,
        timeSpent
      }));
    };

    // Update time every second
    timeIntervalRef.current = setInterval(updateTimeSpent, 1000);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  // Track page visits
  useEffect(() => {
    if (activeTab) {
      visitedPagesRef.current.add(activeTab);
      const pagesVisited = visitedPagesRef.current.size;
      
      setPwaState(prev => ({
        ...prev,
        pagesVisited
      }));
    }
  }, [activeTab]);

  // Check engagement criteria
  useEffect(() => {
    const { timeSpent, pagesVisited } = pwaState;
    const engagementMet = timeSpent >= 30 && pagesVisited >= 2;
    
    setPwaState(prev => ({
      ...prev,
      engagementMet
    }));
  }, [pwaState.timeSpent, pwaState.pagesVisited]);

  useEffect(() => {
    // Check if app is running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    // Check if already installed
    const isInstalled = isStandalone || localStorage.getItem('pwa-installed') === 'true';

    // Check if running in StackBlitz environment
    const isStackBlitz = window.location.hostname.includes('stackblitz') || 
                        window.location.hostname.includes('webcontainer') ||
                        window.location.hostname === 'localhost';

    setPwaState(prev => ({
      ...prev,
      isStandalone,
      isInstalled,
      isIOS,
      isAndroid
    }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      
      setPwaState(prev => ({
        ...prev,
        isInstallable: true
      }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      localStorage.setItem('pwa-installed', 'true');
      setPwaState(prev => ({
        ...prev,
        isInstalled: true,
        showInstallPrompt: false,
        isInstallable: false
      }));
      setDeferredPrompt(null);
      
      // Reset engagement tracking
      visitedPagesRef.current.clear();
      startTimeRef.current = Date.now();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker only if not in StackBlitz environment
    if ('serviceWorker' in navigator && !isStackBlitz) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available - set the new worker
                  console.log('New content available');
                  setNewWorker(installingWorker);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    } else if (isStackBlitz) {
      console.log('Service Worker registration skipped: Running in StackBlitz environment');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Update showInstallPrompt based on all criteria
  useEffect(() => {
    const { isInstallable, isInstalled, engagementMet } = pwaState;
    const shouldShow = isInstallable && !isInstalled && engagementMet && shouldShowPrompt();
    
    setPwaState(prev => ({
      ...prev,
      showInstallPrompt: shouldShow
    }));
  }, [pwaState.isInstallable, pwaState.isInstalled, pwaState.engagementMet]);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem('pwa-installed', 'true');
        setPwaState(prev => ({
          ...prev,
          isInstalled: true,
          showInstallPrompt: false,
          isInstallable: false
        }));
        
        // Reset engagement tracking
        visitedPagesRef.current.clear();
        startTimeRef.current = Date.now();
      } else {
        console.log('User dismissed the install prompt');
        setPwaState(prev => ({
          ...prev,
          showInstallPrompt: false
        }));
        
        // Set dismissal timestamp
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
        
        // Reset engagement tracking so user needs to meet criteria again
        visitedPagesRef.current.clear();
        startTimeRef.current = Date.now();
        setPwaState(prev => ({
          ...prev,
          timeSpent: 0,
          pagesVisited: 0,
          engagementMet: false
        }));
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error during app installation:', error);
      return false;
    }
  };

  const dismissInstallPrompt = () => {
    setPwaState(prev => ({
      ...prev,
      showInstallPrompt: false
    }));
    
    // Don't show again for 24 hours
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    
    // Reset engagement tracking so user needs to meet criteria again
    visitedPagesRef.current.clear();
    startTimeRef.current = Date.now();
    setPwaState(prev => ({
      ...prev,
      timeSpent: 0,
      pagesVisited: 0,
      engagementMet: false
    }));
  };

  const shouldShowPrompt = () => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const dayInMs = 24 * 60 * 60 * 1000;
      return Date.now() - dismissedTime > dayInMs;
    }
    return true;
  };

  return {
    ...pwaState,
    installApp,
    dismissInstallPrompt,
    shouldShowPrompt: shouldShowPrompt(),
    canInstall: !!deferredPrompt,
    newWorker
  };
}