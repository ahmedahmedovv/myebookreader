export const DB_NAME = 'epubReader';
export const DB_VERSION = 2;
export const STORE_NAME = 'epubFiles';

// API Key from environment variable
// Note: In Vite, environment variables must be prefixed with VITE_ to be exposed to client code
// Set this in your .env file: VITE_MISTRAL_API_KEY=your_api_key_here
export const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || '';

if (!MISTRAL_API_KEY) {
  console.warn(
    '⚠️ MISTRAL_API_KEY is not set. Please create a .env file with VITE_MISTRAL_API_KEY=your_api_key'
  );
}

export const CONFIG = {
  SUMMARY_INTERVAL: 5000,
  MAX_SUMMARY_TEXT: 8000,
  SCROLL_THRESHOLD: 100,
  TOP_PANEL_SCROLL_DISTANCE: 10, // Show panel after scrolling up just 10px
  CACHE_TTL_MS: 24 * 60 * 60 * 1000,
} as const;

