import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './OfflineIndicator.css';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(!isOnline);

  useEffect(() => {
    if (isOnline) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(true);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : ''} show`}>
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}

