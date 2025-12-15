import { useRef } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import './TopPanel.css';

interface TopPanelProps {
  onOpenBook: () => void;
  onFileSelect?: (file: File) => void;
}

export function TopPanel({ onOpenBook, onFileSelect }: TopPanelProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHardRefresh = () => {
    const reload = () => {
      const currentUrl = window.location.href.split('?')[0];
      window.location.href = currentUrl + '?t=' + Date.now();
    };

    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (const name of names) {
          caches.delete(name);
        }
      }).then(reload);
    } else {
      reload();
    }
  };

  const handleOpenBook = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,application/epub+zip"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (onFileSelect) {
              onFileSelect(file);
            } else {
              onOpenBook();
            }
          }
        }}
      />
      <header className="top-panel">
        <div className="top-panel-content">
          <div className="top-panel-actions">
            <button 
              className="btn-label dark-mode-toggle" 
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              className="btn-label" 
              onClick={handleOpenBook}
            >
              Open
            </button>
            <button 
              className="btn-label" 
              onClick={handleHardRefresh}
            >
              Refresh
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

