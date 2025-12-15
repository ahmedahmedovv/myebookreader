// Browser compatibility check for Safari 12 and older browsers

export function checkBrowserCompatibility(): { supported: boolean; message?: string } {
  // Check for required features (critical for app to work)
  const criticalFeatures = {
    fetch: typeof fetch !== 'undefined',
    Promise: typeof Promise !== 'undefined',
    localStorage: typeof localStorage !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    createTreeWalker: typeof document.createTreeWalker !== 'undefined',
    DOMParser: typeof DOMParser !== 'undefined',
  };

  // Check for optional features (nice to have but not required)
  const optionalFeatures = {
    serviceWorker: 'serviceWorker' in navigator,
  };

  // Check for critical missing features
  const missingCritical = Object.entries(criticalFeatures)
    .filter(([_, supported]) => !supported)
    .map(([name]) => name);

  if (missingCritical.length > 0) {
    return {
      supported: false,
      message: `Your browser is missing required features: ${missingCritical.join(', ')}. Please update your browser.`,
    };
  }

  // Warn about missing optional features but don't block
  const missingOptionalFeatures = Object.entries(optionalFeatures)
    .filter(([_, supported]) => !supported)
    .map(([name]) => name);

  if (missingOptionalFeatures.length > 0) {
    console.warn('Some optional features are not available:', missingOptionalFeatures);
    // Service Worker requires HTTPS (or localhost), so this is expected on network IPs
    if (missingOptionalFeatures.includes('serviceWorker')) {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.protocol === 'https:';
      if (!isLocalhost && window.location.protocol !== 'https:') {
        console.info('Service Worker not available: requires HTTPS or localhost. Offline features will be limited.');
      }
    }
  }

  // Check for optional but recommended JavaScript features
  const jsFeatures = {
    asyncAwait: checkAsyncAwait(),
    arrowFunctions: checkArrowFunctions(),
    constLet: checkConstLet(),
  };

  const missingJSFeatures = Object.entries(jsFeatures)
    .filter(([_, supported]) => !supported)
    .map(([name]) => name);

  if (missingJSFeatures.length > 0) {
    console.warn('Some optional JavaScript features are not supported:', missingJSFeatures);
  }

  return { supported: true };
}

function checkAsyncAwait(): boolean {
  try {
    // eslint-disable-next-line no-eval
    eval('(async () => {})()');
    return true;
  } catch {
    return false;
  }
}

function checkArrowFunctions(): boolean {
  try {
    // eslint-disable-next-line no-eval
    eval('(() => {})');
    return true;
  } catch {
    return false;
  }
}

function checkConstLet(): boolean {
  try {
    // eslint-disable-next-line no-eval
    eval('const test = 1; let test2 = 2;');
    return true;
  } catch {
    return false;
  }
}

export function showBrowserWarning(message: string): void {
  const warningDiv = document.createElement('div');
  warningDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #C97D60;
    color: white;
    padding: 20px;
    text-align: center;
    z-index: 10000;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  warningDiv.textContent = message;
  document.body.appendChild(warningDiv);
}

