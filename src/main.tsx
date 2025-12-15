import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkBrowserCompatibility, showBrowserWarning } from './utils/browserCheck'

// Check browser compatibility first
const compatibility = checkBrowserCompatibility();
if (!compatibility.supported) {
  showBrowserWarning(compatibility.message || 'Your browser is not supported. Please update to a modern browser.');
} else {
  // Load JSZip from CDN
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    // JSZip is loaded from CDN and available globally
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Root element not found');
      return;
    }

    // Use React 18's createRoot if available, fallback to React 17's render
    try {
      if (ReactDOM.createRoot) {
        ReactDOM.createRoot(rootElement).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        );
      } else {
        // Fallback for older React versions
        // @ts-ignore - React 17 render method
        ReactDOM.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
          rootElement
        );
      }
    } catch (error) {
      console.error('Failed to render app:', error);
      showBrowserWarning('Failed to load the application. Please try refreshing the page or updating your browser.');
    }
  };

  script.onerror = () => {
    console.error('Failed to load JSZip');
    showBrowserWarning('Failed to load required libraries. Please check your internet connection.');
  };
}

