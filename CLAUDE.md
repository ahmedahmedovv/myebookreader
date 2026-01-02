# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Target Device & Compatibility](#target-device--compatibility)
3. [Development Setup](#development-setup)
4. [File Structure](#file-structure)
5. [Architecture Deep Dive](#architecture-deep-dive)
6. [Feature Documentation](#feature-documentation)
7. [Styling System](#styling-system)
8. [Responsive Design](#responsive-design)
9. [API Integration](#api-integration)
10. [State Management](#state-management)
11. [Critical Implementation Rules](#critical-implementation-rules)
12. [Common Pitfalls](#common-pitfalls)
13. [Testing Guidelines](#testing-guidelines)

---

## Project Overview

**AI-Powered EPUB Reader** - A client-side web application for reading EPUB books with intelligent features:

| Feature | Description |
|---------|-------------|
| Word Pronunciation | Click any word to hear it spoken aloud (Web Speech API) |
| Word Definitions | AI-powered definitions with example sentences (Mistral AI) |
| Section Summaries | Auto-generated summaries every ~1000 words |
| Dark Mode | System-wide theming with localStorage persistence |
| Reading Progress | Scroll position saved per book |

**Tech Stack:**
- Pure HTML/CSS/JavaScript (no build system)
- JSZip (CDN) for EPUB parsing
- Mistral AI API for definitions/summaries
- Web Speech API for text-to-speech
- Bookerly font (CDN)

---

## Target Device & Compatibility

### Primary Target: iPad mini 3 with iOS 12 Safari

This is the **most critical constraint**. All code must work on iOS 12 Safari (released 2018).

#### Allowed JavaScript Features
```javascript
// YES - Safe to use
var, let, const
Arrow functions: () => {}
Promises: new Promise(), .then(), .catch()
async/await (with caution)
Template literals: `${var}`
Array methods: map, filter, forEach, find
Object.entries(), Object.keys()
IntersectionObserver
localStorage
fetch API
```

#### Forbidden JavaScript Features
```javascript
// NO - Will break on iOS 12
Optional chaining: obj?.property
Nullish coalescing: value ?? default
Array.prototype.flat()
Array.prototype.flatMap()
Object.fromEntries()
String.prototype.matchAll()
globalThis
BigInt
```

#### CSS Compatibility Notes
- Flexbox: Fully supported
- CSS Grid: Basic support (avoid subgrid)
- CSS Variables: Fully supported
- `env(safe-area-inset-*)`: Supported
- `gap` in flexbox: NOT supported (use margins instead)

---

## Development Setup

### Running Locally

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve .

# Option 3: PHP
php -S localhost:8000
```

Then open: `http://localhost:8000`

### No Build Process Required
- Edit files directly
- Refresh browser to see changes
- All dependencies loaded via CDN

---

## File Structure

```
107/
├── index.html      # Main HTML (44 lines)
├── script.js       # All JavaScript logic (539 lines)
├── style.css       # All styles (480 lines)
└── CLAUDE.md       # This documentation
```

### index.html Structure
```html
<body>
    <header id="header">           <!-- Fixed 56px icon bar -->
        <div class="header-content">
            <div class="header-brand">   <!-- 📖 logo -->
            <div class="header-actions"> <!-- 📁 upload, ☀️🌙 dark mode -->
        </div>
        <input type="file" id="epubInput" hidden>
        <div id="loadingBar">      <!-- Progress bar -->
    </header>

    <main id="content"></main>     <!-- EPUB content renders here -->

    <div id="popup">               <!-- Bottom sheet for definitions -->
        <div id="popupContent">
    </div>
</body>
```

---

## Architecture Deep Dive

### 1. SpeechService Class (script.js:3-58)

Handles text-to-speech using the native Web Speech API.

```javascript
var SpeechService = (function() {
    // IIFE pattern for iOS 12 compatibility
    // Properties: isSpeaking, speechRate, currentUtterance
    // Methods: speak(text, callback), stop(), setSpeechRate(rate)
})();

var speechService = new SpeechService();  // Global instance
```

**Key behaviors:**
- Auto-stops previous speech before starting new
- Default rate: 1.0 (range: 0.5 - 2.0)
- Language: English ('en')
- Graceful fallback if Web Speech API unavailable

---

### 2. EPUB Processing Pipeline (script.js:159-298)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  File Input │ --> │  FileReader │ --> │   JSZip     │
│   (.epub)   │     │ (to buffer) │     │  (unzip)    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        ▼                                     ▼                                     ▼
┌───────────────┐                    ┌───────────────┐                    ┌───────────────┐
│  HTML Files   │                    │   CSS Files   │                    │ Image Files   │
│ .html, .xhtml │                    │     .css      │                    │ jpg,png,gif.. │
└───────────────┘                    └───────────────┘                    └───────────────┘
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────┐                    ┌───────────────┐                    ┌───────────────┐
│  Concatenate  │                    │  Create Map   │                    │ Convert to    │
│  all HTML     │                    │ (name→content)│                    │  Data URLs    │
└───────────────┘                    └───────────────┘                    └───────────────┘
        │                                     │                                     │
        └─────────────────────────────────────┼─────────────────────────────────────┘
                                              ▼
                                    ┌───────────────────┐
                                    │    DOMParser      │
                                    │ (parse combined)  │
                                    └───────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
          ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
          │ Replace <link>  │       │ Replace <img>   │       │ divideSections  │
          │ with <style>    │       │ src with data:  │       │ (add Summary    │
          └─────────────────┘       └─────────────────┘       │  buttons)       │
                    │                         │               └─────────────────┘
                    └─────────────────────────┼─────────────────────────┘
                                              ▼
                                    ┌───────────────────┐
                                    │ Render to #content│
                                    │ + setup observers │
                                    └───────────────────┘
```

**Resource Lookup Strategy:**
```javascript
// Images and CSS are stored with multiple keys for flexible lookup:
imageDataMap[fileName] = dataUrl;        // "cover.jpg"
imageDataMap[path] = dataUrl;            // "OEBPS/images/cover.jpg"
imageDataMap['images/' + fileName] = dataUrl;  // "images/cover.jpg"
```

---

### 3. Lazy Text Wrapping (script.js:108-157)

**Problem:** Wrapping every word in `<span>` on large EPUBs causes massive DOM bloat and crashes.

**Solution:** IntersectionObserver-based lazy loading.

```
┌─────────────────────────────────────────────────────────────┐
│                      VIEWPORT                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Visible content (words already wrapped)              │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ▲ 400px rootMargin - trigger zone                          │
│  │                                                          │
│  │  ┌───────────────────────────────────────────────────┐  │
│  │  │  Paragraphs enter here → wrapWordsInElement()     │  │
│  │  │  Words get wrapped in <span class="word">         │  │
│  │  │  dataset.wrapped = 'true' prevents re-processing  │  │
│  │  └───────────────────────────────────────────────────┘  │
│  │                                                          │
│  │  ┌───────────────────────────────────────────────────┐  │
│  │  │  Unwrapped content (plain text, not clickable)    │  │
│  │  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Wrapping Exclusions (CRITICAL):**
```javascript
// Skip these when wrapping words:
1. Text inside .section-trigger buttons
2. Text inside <style> tags
3. Text inside <script> tags
```

---

### 4. Section Division (script.js:389-451)

Inserts "Summary" buttons every ~1000 words.

```javascript
// Recursive DOM traversal
function processNode(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
        // Count words (skip <style>/<script> content)
        // Clone node to result
        // If wordCount >= 1000, insert Summary button
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Clone element (shallow)
        // Recurse into children
    }
}
```

**Data storage:**
```javascript
button.dataset.summaryText = sectionText;  // Up to 1000 words stored
```

---

### 5. Event Flow

```
User clicks word
        │
        ▼
handleWordClick(e)
        │
        ├──► speechService.speak(word)     // Immediate pronunciation
        │
        ├──► Show popup with "Loading..."
        │
        ├──► await getWordDefinition(word)  // Mistral API call
        │
        └──► Update popup with definition + example


User scrolls
        │
        ▼
scroll event listener
        │
        ├──► Update header visibility (hide on scroll down)
        │
        ├──► popup.classList.remove('active')  // Dismiss popup
        │
        ├──► speechService.stop()              // Stop any speech
        │
        └──► saveScrollPosition()              // Persist to localStorage
```

---

## Feature Documentation

### Word Click & Speech (script.js:453-478)

```javascript
async function handleWordClick(e) {
    const cleanWord = word.replace(/[^\w'-]/g, '');  // Strip punctuation

    // Minimum 2 characters required
    if (!cleanWord || cleanWord.length < 2) return;

    speechService.speak(cleanWord);  // Speak immediately

    // Show popup, fetch definition...
}
```

### Dark Mode (script.js:77-101)

```javascript
// Initialization (on page load)
initDarkMode();  // Reads localStorage('darkMode')

// Toggle
toggleDarkMode();  // Toggles body.dark-mode class, saves preference

// CSS handles the rest via variables
body.dark-mode { --bg-primary: #1a1a1a; ... }
```

### Scroll Persistence (script.js:497-511)

```javascript
// Key format: scroll_${filename}
localStorage.setItem('scroll_mybook.epub', '1234');

// Restored after EPUB loads
restoreScrollPosition();
```

---

## Styling System

### CSS Variables (style.css:4-38)

```css
:root {
    /* Light mode (default) */
    --bg-primary: #ffffff;
    --bg-secondary: #f9f6f1;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --accent-primary: #3498db;
    --border-color: #e0e0e0;
    --popup-shadow: rgba(0, 0, 0, 0.3);
    /* ... more variables */
}

body.dark-mode {
    /* Dark mode overrides */
    --bg-primary: #1a1a1a;
    --bg-secondary: #0d0d0d;
    --text-primary: #e0e0e0;
    /* ... */
}
```

### Key Classes

| Class | Purpose | Location |
|-------|---------|----------|
| `.word` | Clickable word spans | Content area |
| `.section-trigger` | Summary buttons | Between sections |
| `.icon-btn` | Header buttons | Header |
| `.popup` | Bottom sheet container | Fixed bottom |
| `.popup-content` | Inner popup content | Inside popup |
| `.loading` | Loading state text | Popup |

---

## Responsive Design

### Breakpoints

```css
/* Mobile Portrait */
@media (max-width: 480px) { ... }

/* Mobile Landscape & iPad Mini Portrait */
@media (min-width: 481px) and (max-width: 834px) { ... }

/* iPad Mini Landscape & Tablets */
@media (min-width: 835px) and (max-width: 1024px) { ... }
```

### Touch Optimizations

```css
/* Minimum tap targets */
.icon-btn { width: 40px; height: 40px; }  /* 36-40px across breakpoints */
.section-trigger { min-height: 44px; }

/* Disable tap highlight */
* { -webkit-tap-highlight-color: transparent; }

/* iOS momentum scrolling */
.popup-content { -webkit-overflow-scrolling: touch; }

/* Safe areas for notched devices */
padding-top: max(56px, env(safe-area-inset-top));
```

---

## API Integration

### Mistral AI Configuration

```javascript
const MISTRAL_API_KEY = 'xxx';  // Line 1 of script.js
const MODEL = 'mistral-large-latest';
const ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';
```

### API Call Pattern (script.js:300-324)

```javascript
async function callAI(prompt, systemPrompt) {
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        })
    });
    return data.choices[0].message.content;
}
```

### Response Parsing (Word Definitions)

```javascript
// Handle multiple response formats:
// 1. "Definition: xxx\nExample: xxx"  (labeled)
// 2. "xxx\nxxx"                        (unlabeled, 2 lines)
// 3. "xxx"                             (single line)

// Always strip markdown:
text.replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold**
    .replace(/\*([^*]+)\*/g, '$1')       // *italic*
    .replace(/_([^_]+)_/g, '$1')         // _underline_
    .replace(/`([^`]+)`/g, '$1')         // `code`
```

---

## State Management

### Global Variables (script.js:63-75)

```javascript
const WORD_THRESHOLD = 1000;      // Words per section
let isBookLoaded = false;         // Guards scroll handlers
let currentBookName = '';         // For scroll persistence key
let lastScrollY = 0;              // For header hide logic
```

### DOM References

```javascript
const header = document.getElementById('header');
const content = document.getElementById('content');
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popupContent');
const epubInput = document.getElementById('epubInput');
const loadingBar = document.getElementById('loadingBar');
const loadingProgress = document.getElementById('loadingProgress');
const darkModeToggle = document.getElementById('darkModeToggle');
const uploadBtn = document.getElementById('uploadBtn');
```

### localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `darkMode` | `'enabled'` or `'disabled'` | Theme preference |
| `scroll_${filename}` | Number (pixels) | Reading position |

---

## Critical Implementation Rules

### 1. iOS 12 JavaScript Compatibility
```javascript
// WRONG
const value = obj?.property ?? 'default';

// RIGHT
const value = (obj && obj.property) ? obj.property : 'default';
```

### 2. Word Wrapping Exclusions
```javascript
// Always check parent chain before wrapping text nodes
let parent = node.parentNode;
while (parent) {
    if (parent.classList && parent.classList.contains('section-trigger')) {
        skipNode = true;  // Don't wrap Summary button text
        break;
    }
    if (parent.nodeName === 'STYLE' || parent.nodeName === 'SCRIPT') {
        skipText = true;  // Don't count CSS/JS as words
        break;
    }
    parent = parent.parentNode;
}
```

### 3. CSS Colors
```css
/* WRONG - hardcoded */
color: #2c3e50;

/* RIGHT - use variables */
color: var(--text-primary);
```

### 4. Popup Dismissal
```javascript
// Primary: scroll dismisses popup
window.addEventListener('scroll', () => {
    popup.classList.remove('active');
    speechService.stop();
});

// Secondary: click outside content
popup.addEventListener('click', (e) => {
    if (e.target === popup) {
        popup.classList.remove('active');
        speechService.stop();
    }
});
```

### 5. FileReader over Modern APIs
```javascript
// WRONG - not supported in iOS 12
const buffer = await file.arrayBuffer();

// RIGHT - use FileReader
const buffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
});
```

---

## Common Pitfalls

### 1. Speech Not Stopping
Always call `speechService.stop()` when:
- Popup closes
- User scrolls
- New word is clicked

### 2. Words Not Clickable
Check if:
- Element has `dataset.wrapped = 'true'` (already processed)
- Parent element is being observed by IntersectionObserver
- Text is not inside excluded elements

### 3. Summary Button Text Becomes Clickable
The word wrapping exclusion check must traverse up the DOM tree to find `.section-trigger` parents.

### 4. CSS/JS Code Appears in Summaries
The `divideSections` function must skip text nodes inside `<style>` and `<script>` tags.

### 5. Images Not Loading
Check all three path variations in `imageDataMap`:
- Full path: `OEBPS/images/cover.jpg`
- Filename only: `cover.jpg`
- With images prefix: `images/cover.jpg`

---

## Testing Guidelines

### Manual Testing Checklist

1. **EPUB Loading**
   - [ ] Progress bar advances smoothly
   - [ ] Images display correctly
   - [ ] CSS styles are applied
   - [ ] No console errors

2. **Word Interaction**
   - [ ] Click word → hear pronunciation
   - [ ] Click word → see definition popup
   - [ ] Definition includes example sentence
   - [ ] Punctuation stripped from displayed word

3. **Section Summaries**
   - [ ] Summary buttons appear every ~1000 words
   - [ ] Clicking shows "Generating summary..."
   - [ ] Summary content is relevant to section

4. **UI/UX**
   - [ ] Scroll hides header (after 100px, going down)
   - [ ] Scroll dismisses popup
   - [ ] Dark mode toggle works
   - [ ] Dark mode persists across refresh

5. **iOS 12 Specific**
   - [ ] Test on actual iPad mini 3 or iOS 12 simulator
   - [ ] No JavaScript errors in console
   - [ ] Touch interactions responsive

---

## External Dependencies

| Dependency | CDN URL | Purpose |
|------------|---------|---------|
| JSZip 3.10.1 | `cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` | EPUB unzipping |
| Bookerly Font | `fonts.cdnfonts.com/css/bookerly` | Reading typography |

---

## Line Number Reference (script.js)

| Lines | Function/Section |
|-------|------------------|
| 1 | API Key |
| 3-58 | SpeechService class |
| 60-61 | Speech service instance |
| 63-75 | Global variables & DOM refs |
| 77-101 | Dark mode functions |
| 108-157 | Lazy text wrapping (IntersectionObserver) |
| 159-298 | EPUB processing |
| 300-324 | callAI() function |
| 326-377 | getWordDefinition() |
| 379-387 | getSectionSummary() |
| 389-451 | divideSections() |
| 453-478 | handleWordClick() |
| 480-487 | handleSectionSummary() |
| 489-495 | Popup click-outside handler |
| 497-511 | Scroll persistence |
| 513-530 | Scroll event handler |
| 532-538 | File input handler |
