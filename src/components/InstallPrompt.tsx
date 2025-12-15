import { useState, useEffect } from 'react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed') === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (dismissed || isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="install-prompt show">
      Install this app for a better experience
      <button onClick={handleInstall}>Install</button>
      <button 
        onClick={handleDismiss}
        style={{ background: 'transparent', color: 'white', border: '1px solid white' }}
      >
        ✕
      </button>
    </div>
  );
}

