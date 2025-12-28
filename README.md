# EPUB Reader

A modern web app for reading EPUB files with AI-powered dictionary lookup and summaries.

## Features

- 📖 Read EPUB files
- 📚 Click words for AI-powered definitions
- 📝 Get summaries every 5000 characters
- 💾 Works offline
- 📱 Installable PWA
- 🎨 Dark mode support

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file and add your Mistral AI API key:
```
VITE_MISTRAL_API_KEY=your_api_key_here
```

Get your API key from: https://console.mistral.ai/

3. Start the app:
```bash
npm run dev
```

4. Open `http://localhost:3000` in your browser

## Build

```bash
npm run build
```

## Usage

1. Click "Open" to select an EPUB file
2. Click any word to see its definition
3. Click summary markers (📝) to get AI summaries
4. Your reading position is saved automatically

## Tech Stack

- React 18 + TypeScript
- Vite
- Mistral AI API

## License

MIT
