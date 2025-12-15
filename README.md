# EPUB Reader - React TypeScript Version

A modern Progressive Web App (PWA) for reading EPUB files with AI-powered dictionary lookup and text summarization, built with React and TypeScript.

## Features

- 📖 **EPUB Reading**: Full support for EPUB file format
- 📚 **Dictionary Lookup**: Click on words to get AI-powered definitions
- 📝 **AI Summaries**: Get summaries every 5000 characters
- 💾 **Offline Support**: Works offline with Service Worker caching
- 📱 **PWA**: Installable Progressive Web App
- 💾 **Persistent Storage**: Saves EPUB files and reading position
- 🎨 **Modern UI**: Clean, responsive design

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **JSZip** - EPUB file parsing
- **IndexedDB** - Local storage
- **Service Worker** - Offline functionality

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Mistral AI API key:
   ```
   VITE_MISTRAL_API_KEY=your_api_key_here
   ```
   
   ⚠️ **Important**: The `.env` file is already in `.gitignore` and will not be committed to git.

3. Start development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── BookInfo.tsx    # Book information panel
│   ├── DefinitionPanel.tsx  # Dictionary/summary panel
│   ├── FileButton.tsx  # File upload button
│   ├── InstallPrompt.tsx  # PWA install prompt
│   ├── OfflineIndicator.tsx  # Online/offline indicator
│   ├── Reader.tsx      # Main EPUB reader component
│   └── TopPanel.tsx    # Top navigation panel
├── hooks/              # Custom React hooks
│   ├── useEpub.ts      # EPUB loading logic
│   ├── useOnlineStatus.ts  # Online status tracking
│   └── useScroll.ts    # Scroll position management
├── utils/               # Utility functions
│   ├── api.ts          # API calls (Mistral AI)
│   ├── constants.ts    # App constants
│   ├── epub.ts         # EPUB parsing logic
│   ├── serviceWorker.ts  # Service Worker registration
│   └── storage.ts      # IndexedDB/localStorage utilities
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Usage

1. **Open an EPUB file**: Click "Open EPUB" button and select a file
2. **Read**: Scroll through the book content
3. **Get definitions**: Click on any word to highlight it and see its definition
4. **Get summaries**: Click on the 📝 markers to get AI summaries
5. **Install as PWA**: Use the install prompt to add to home screen

## Configuration

### API Key

The API key is now stored in environment variables for better security.

**Setup:**
1. Create a `.env` file in the project root
2. Add your Mistral AI API key: `VITE_MISTRAL_API_KEY=your_api_key_here`
3. Get your API key from: https://console.mistral.ai/

**Security Notes:**
- ⚠️ The `.env` file is gitignored and will not be committed
- ⚠️ **Important**: Even with environment variables, API keys are still exposed in the client bundle since this is a client-side app
- 🔒 **For production**, consider:
  1. Moving API calls to a backend proxy server
  2. Implementing rate limiting per user/IP
  3. Using API key rotation
  4. Monitoring API usage for abuse

### Constants

Edit `src/utils/constants.ts` to customize:
- `SUMMARY_INTERVAL`: Characters between summary markers (default: 5000)
- `SCROLL_THRESHOLD`: Scroll position for showing book info (default: 100px)
- `TOP_PANEL_SCROLL_DISTANCE`: Scroll distance to show top panel (default: 80px)

## Service Worker

The app includes a Service Worker for offline functionality:
- Caches static assets
- Caches API responses (24h TTL)
- Enables offline reading

Service Worker file: `public/sw.js` (keep the original service worker)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Type Checking

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Notes

- The app automatically saves your reading position
- EPUB files are stored in IndexedDB
- Definitions and summaries are cached in localStorage
- The app works offline after initial load

## License

MIT

# myebookreader
