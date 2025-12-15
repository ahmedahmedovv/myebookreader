export function registerServiceWorker() {
  // Service Worker requires HTTPS (or localhost)
  const isSecureContext = window.location.protocol === 'https:' ||
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

  if ('serviceWorker' in navigator && isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New service worker available');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[SW] Service Worker registration failed:', error);
        });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_READY') {
          console.log('[SW] Service Worker is ready');
        }
      });
    });
  } else if (!isSecureContext) {
    console.info('[SW] Service Worker not available: requires HTTPS or localhost. App will work but offline features will be limited.');
  } else {
    console.info('[SW] Service Worker not supported in this browser. App will work but offline features will be limited.');
  }
}

