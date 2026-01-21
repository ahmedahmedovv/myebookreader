# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

---

## Critical Constraint: iOS 12 Compatibility

> **This app MUST run on iPad mini 3 with iOS 12 Safari.**
>
> iOS 12 was released in 2018. Every line of JavaScript and CSS must work on this older browser engine. **Test assumptions against the compatibility tables below before writing any code.**

---

## Table of Contents

1. [iOS 12 JavaScript Rules](#ios-12-javascript-rules)
2. [iOS 12 CSS Rules](#ios-12-css-rules)
3. [Project Overview](#project-overview)
4. [File Structure](#file-structure)
5. [Architecture](#architecture)
6. [Feature Documentation](#feature-documentation)
   - [SpeechService](#speechservice-web-speech-api)
   - [Lazy Word Wrapping](#lazy-word-wrapping)
   - [EPUB Resource Resolution](#epub-resource-resolution)
   - [Saved Words & Export](#saved-words--export-feature)
7. [Styling System](#styling-system)
8. [API Integration](#api-integration)
9. [Common Patterns](#common-patterns)
10. [Testing Checklist](#testing-checklist)

---

## iOS 12 JavaScript Rules

### FORBIDDEN - Will Crash on iOS 12

```javascript
// ❌ NEVER USE THESE

// Optional chaining (ES2020)
const value = obj?.property;
const result = obj?.method?.();
const item = arr?.[0];

// Nullish coalescing (ES2020)
const value = x ?? 'default';

// Logical assignment (ES2021)
x ||= 'default';
x &&= 'value';
x ??= 'fallback';

// Array methods (ES2019+)
arr.flat();
arr.flatMap(fn);
arr.at(-1);

// Object methods (ES2019+)
Object.fromEntries(entries);

// String methods (ES2019+)
str.matchAll(regex);
str.replaceAll('a', 'b');
str.trimStart();
str.trimEnd();

// Other (ES2020+)
globalThis
BigInt
Promise.allSettled()
Promise.any()
String.prototype.matchAll()

// Modern File API
await file.arrayBuffer();  // Not supported!
await file.text();         // Not supported!

// Modern Clipboard API
navigator.clipboard.writeText();  // Not supported until iOS 13.4!
navigator.clipboard.readText();   // Not supported!
```

### ALLOWED - Safe for iOS 12

```javascript
// ✅ SAFE TO USE

// Variables and functions
var, let, const
function() {}, () => {}
async/await
class (but prefer IIFE for critical code)

// Promises
new Promise((resolve, reject) => {})
promise.then().catch().finally()
Promise.all()
Promise.race()

// Template literals
`Hello ${name}`
`Multiline
string`

// Destructuring
const { a, b } = obj;
const [x, y] = arr;

// Spread/rest
const newArr = [...arr1, ...arr2];
const newObj = { ...obj1, ...obj2 };
function(...args) {}

// Array methods (ES5-ES2017)
map, filter, reduce, forEach, find, findIndex
some, every, includes, indexOf
Array.from(), Array.isArray()

// Object methods (ES5-ES2017)
Object.keys(), Object.values(), Object.entries()
Object.assign()

// String methods (ES5-ES2017)
includes, startsWith, endsWith
trim, padStart, padEnd
repeat, split, slice

// Other
IntersectionObserver
MutationObserver
fetch API
localStorage / sessionStorage
Web Speech API
FileReader (use this instead of file.arrayBuffer())
DOMParser
URLSearchParams
document.execCommand('copy')  // For clipboard (deprecated but iOS 12 compatible)
```

### iOS 12 Safe Patterns

```javascript
// ❌ WRONG: Optional chaining
const name = user?.profile?.name;

// ✅ RIGHT: Manual null checks
const name = user && user.profile && user.profile.name;
// Or with a helper:
function safeGet(obj, path) {
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

// ❌ WRONG: Nullish coalescing
const value = input ?? 'default';

// ✅ RIGHT: Ternary or logical OR (if falsy is acceptable)
const value = input !== null && input !== undefined ? input : 'default';
const value = input || 'default';  // Only if 0, '', false are not valid

// ❌ WRONG: Modern File API
const buffer = await file.arrayBuffer();

// ✅ RIGHT: FileReader
const buffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
});

// ❌ WRONG: Array.prototype.flat()
const flat = nested.flat();

// ✅ RIGHT: Manual flatten
const flat = [].concat(...nested);
// Or for deep flatten:
function flatten(arr) {
    return arr.reduce((acc, val) =>
        Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);
}

// ❌ WRONG: replaceAll
const result = str.replaceAll('a', 'b');

// ✅ RIGHT: replace with regex
const result = str.replace(/a/g, 'b');

// ❌ WRONG: at() for negative indexing
const last = arr.at(-1);

// ✅ RIGHT: Manual indexing
const last = arr[arr.length - 1];

// ❌ WRONG: Modern Clipboard API
await navigator.clipboard.writeText(text);

// ✅ RIGHT: execCommand with temporary textarea (iOS 12 compatible)
function copyToClipboard(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);  // CRITICAL for iOS
    var success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
}
```

### Class Pattern for iOS 12

ES6 classes can have edge cases on older WebKit. For critical components, use IIFE + prototype:

```javascript
// ✅ RECOMMENDED: IIFE pattern (used in SpeechService)
var MyService = (function() {
    function MyService() {
        this.state = null;
    }

    MyService.prototype.doSomething = function() {
        var self = this;  // Capture 'this' for callbacks
        setTimeout(function() {
            self.state = 'done';
        }, 100);
    };

    return MyService;
})();

var instance = new MyService();
```

---

## iOS 12 CSS Rules

### FORBIDDEN CSS

```css
/* ❌ NEVER USE */

/* Gap in flexbox (Safari 14.1+) */
.container {
    display: flex;
    gap: 10px;  /* NOT SUPPORTED */
}

/* Subgrid (Safari 16+) */
.child {
    display: subgrid;
}

/* aspect-ratio (Safari 15+) */
.box {
    aspect-ratio: 16 / 9;
}

/* :is() and :where() (Safari 14+) */
:is(h1, h2, h3) { }
:where(.a, .b) { }

/* :has() (Safari 15.4+) */
.parent:has(.child) { }

/* Container queries (Safari 16+) */
@container (min-width: 400px) { }

/* Logical properties partial support */
margin-inline: 10px;  /* Risky */
padding-block: 10px;  /* Risky */
```

### ALLOWED CSS

```css
/* ✅ SAFE TO USE */

/* Flexbox (fully supported) */
.container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}

/* Use margins instead of gap */
.container > * {
    margin-right: 10px;
}
.container > *:last-child {
    margin-right: 0;
}

/* CSS Grid (basic support) */
.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;  /* Older syntax, supported */
}

/* CSS Variables */
:root {
    --color-primary: #3498db;
}
.element {
    color: var(--color-primary);
}

/* Safe area insets */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);

/* max() function */
padding-top: max(20px, env(safe-area-inset-top));

/* Transforms and transitions */
transform: translateY(-100%);
transition: transform 0.3s ease;

/* Media queries */
@media (max-width: 480px) { }
@media (min-width: 481px) and (max-width: 834px) { }

/* Feature queries */
@supports (-webkit-overflow-scrolling: touch) { }
```

### Touch Optimization for iPad

```css
/* Disable tap highlight */
* {
    -webkit-tap-highlight-color: transparent;
}

/* Minimum touch targets (44px recommended by Apple) */
.button {
    min-width: 44px;
    min-height: 44px;
}

/* Prevent text selection on interactive elements */
.interactive {
    user-select: none;
    -webkit-user-select: none;
}

/* Touch manipulation */
.scrollable {
    touch-action: manipulation;
    -webkit-overflow-scrolling: touch;
}

/* Prevent zoom on input focus */
input, textarea, select {
    font-size: 16px;  /* Prevents auto-zoom */
}
```

---

## Project Overview

**AI-Powered EPUB Reader** - A client-side web app for reading EPUB books with:

| Feature | Technology | Description |
|---------|------------|-------------|
| Word Pronunciation | Web Speech API | Tap any word to hear it spoken |
| Word Definitions | Mistral AI API | AI-generated definitions + example sentences |
| Section Summaries | Mistral AI API | Auto-generated summaries every ~1000 words |
| **Saved Words** | localStorage | Auto-save clicked words for later study |
| **Export to Flashcards** | Clipboard / CSV | Copy or export words to Anki, Quizlet, etc. |
| Dark Mode | CSS Variables + localStorage | System-wide theming with persistence |
| Reading Progress | Scroll position in localStorage | Resume where you left off |

**Tech Stack:**
- Pure HTML/CSS/JavaScript (no build system)
- JSZip (CDN) for EPUB parsing
- Bookerly font (CDN)

---

## File Structure

```
myebookreader/
├── index.html      # HTML structure (~95 lines)
├── script.js       # All JavaScript (~740 lines)
├── style.css       # All styles (~720 lines)
└── CLAUDE.md       # This documentation
```

### Running Locally

```bash
python -m http.server 8000
# or
npx serve .
```

Open: `http://localhost:8000`

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              index.html                                      │
├─────────────┬──────────────────┬─────────────────┬──────────────────────────┤
│   Header    │     Content      │  Popup (Bottom  │   Word List Panel        │
│   (56px)    │   EPUB renders   │    Sheet)       │   (Slide-in Right)       │
│  - Words    │   here with      │  Definitions/   │  - Saved words list      │
│  - Upload   │   clickable      │  Summary        │  - Copy All button       │
│  - Dark     │   words          │                 │  - Export CSV button     │
│    mode     │                  │                 │  - Clear button          │
├─────────────┴──────────────────┴─────────────────┴──────────────────────────┤
│   Panel Overlay (dims background when word list open)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│   Export Modal (CSV text for manual copy)                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│   Toast Notifications (bottom-center feedback)                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
EPUB File → FileReader → JSZip → DOMParser → Content Area
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              CSS inlined    Images → Data URLs   Section dividers
                                                  (Summary buttons)
                                     │
                                     ▼
                          IntersectionObserver
                          (lazy word wrapping)
                                     │
                                     ▼
                          Word click → Speech + AI Definition
                                     │
                                     ▼
                          Auto-save to localStorage
                                     │
                                     ▼
                          Export: Copy to Clipboard / CSV Modal
```

### Key Classes/Functions

| Name | Location | Purpose |
|------|----------|---------|
| `SpeechService` | script.js:3-58 | Web Speech API wrapper (IIFE pattern) |
| `processEPUB()` | script.js:175-314 | Main EPUB loading pipeline |
| `wrapWordsInElement()` | script.js:136-173 | Lazy word span wrapping |
| `divideSections()` | script.js:405-467 | Insert Summary buttons every ~1000 words |
| `callAI()` | script.js:316-340 | Mistral API wrapper |
| `handleWordClick()` | script.js:469-498 | Word tap handler + auto-save |
| `getSavedWords()` | script.js:545-551 | Read saved words from localStorage |
| `saveWord()` | script.js:558-575 | Add word to saved list |
| `copyWordsToClipboard()` | script.js:625-655 | iOS 12-safe clipboard copy |
| `showExportModal()` | script.js:658-676 | Show CSV export modal |
| `showToast()` | script.js:693-716 | Display toast notification |

---

## Feature Documentation

### SpeechService (Web Speech API)

```javascript
// Usage
speechService.speak('hello');     // Speak word
speechService.stop();             // Stop current speech
speechService.setSpeechRate(1.5); // Adjust speed (0.5-2.0)
```

**iOS 12 Notes:**
- Works reliably on iPad
- Auto-stops previous utterance before new one
- Gracefully handles API unavailability

### Lazy Word Wrapping

Words are only wrapped in `<span class="word">` when they approach the viewport:

```javascript
const observer = new IntersectionObserver(callback, {
    rootMargin: '400px'  // Pre-wrap 400px before visible
});
```

**Critical exclusions:**
1. Text inside `.section-trigger` buttons
2. Text inside `<style>` tags
3. Text inside `<script>` tags

### EPUB Resource Resolution

Images and CSS are stored with multiple path keys:

```javascript
// For image at "OEBPS/images/cover.jpg"
imageDataMap['cover.jpg'] = dataUrl;
imageDataMap['OEBPS/images/cover.jpg'] = dataUrl;
imageDataMap['images/cover.jpg'] = dataUrl;
```

---

### Saved Words & Export Feature

This feature allows users to automatically save words they look up and export them for use in flashcard apps like Anki, Quizlet, Memrise, etc.

#### User Flow

```
1. READ BOOK
   └── Tap any word
       ├── Popup shows definition
       ├── Word is spoken aloud
       └── Word AUTO-SAVED to localStorage (toast: "Word saved: hello")

2. VIEW SAVED WORDS
   └── Tap book icon (with badge count) in header
       └── Word List Panel slides in from right
           ├── See all saved words with definitions
           ├── Delete individual words (X button)
           └── See total count

3. EXPORT FOR FLASHCARDS
   ├── Option A: "Copy All" button
   │   └── Copies tab-separated text to clipboard
   │       └── Paste directly into Anki/Quizlet import
   │
   └── Option B: "Export CSV" button
       └── Opens modal with CSV text
           └── Select All → Copy → Paste into spreadsheet
```

#### Data Structure

```javascript
// Stored in localStorage under key: 'savedWords'
[
    {
        word: "ephemeral",
        definition: "Lasting for a very short time.",
        example: "The ephemeral beauty of cherry blossoms.",
        timestamp: 1705849200000,
        bookName: "vocabulary-guide.epub"
    },
    {
        word: "ubiquitous",
        definition: "Present, appearing, or found everywhere.",
        example: "Smartphones have become ubiquitous in modern society.",
        timestamp: 1705849300000,
        bookName: "vocabulary-guide.epub"
    }
]
```

#### localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `savedWords` | JSON Array | All saved words with definitions |
| `darkMode` | String | `'enabled'` or `'disabled'` |
| `scroll_${filename}` | Number | Reading position per book |

#### Export Formats

**Tab-Separated (Copy All button):**
```
ephemeral	Lasting for a very short time.	The ephemeral beauty of cherry blossoms.
ubiquitous	Present, appearing, or found everywhere.	Smartphones have become ubiquitous.
```

**CSV (Export CSV button):**
```csv
Word,Definition,Example
"ephemeral","Lasting for a very short time.","The ephemeral beauty of cherry blossoms."
"ubiquitous","Present, appearing, or found everywhere.","Smartphones have become ubiquitous."
```

#### Flashcard App Import Instructions

**Anki:**
1. Tap "Copy All" in the app
2. In Anki: File → Import
3. Paste into a text file or use clipboard import add-on
4. Set field separator: Tab
5. Map fields: Field 1 → Front, Field 2 → Back, Field 3 → Extra

**Quizlet:**
1. Tap "Copy All" in the app
2. In Quizlet: Create Set → Import from Word, Excel, Google Docs, etc.
3. Paste the copied text
4. Set "Between term and definition": Tab
5. Set "Between cards": New line

**Apple Notes / Google Docs:**
1. Tap "Export CSV" in the app
2. Select All → Copy
3. Paste into Notes/Docs for manual card creation

#### iOS 12 Clipboard Implementation

The modern `navigator.clipboard` API is **NOT available on iOS 12**. We use the legacy `document.execCommand('copy')` method:

```javascript
function copyWordsToClipboard() {
    var saved = getSavedWords();

    // Tab-separated format for Anki/Quizlet
    var text = saved.map(function(item) {
        return item.word + '\t' + item.definition + '\t' + (item.example || '');
    }).join('\n');

    // Create temporary textarea (iOS 12 compatible)
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');  // Prevent keyboard popup
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);

    // CRITICAL for iOS: must use setSelectionRange, not select()
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);

    var success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Copy failed:', err);
    }

    document.body.removeChild(textarea);
    return success;
}
```

**Why This Pattern:**
1. `textarea.select()` alone doesn't work on iOS Safari
2. `setSelectionRange(0, length)` is required for iOS text selection
3. `readonly` attribute prevents the keyboard from appearing
4. Off-screen positioning (`left: -9999px`) hides the textarea

#### Why No Direct File Download?

iOS Safari has a **long-standing bug** where the `<a download="file.csv">` attribute is ignored. Instead of downloading, Safari:
- Opens the file as plain text in a new tab
- Or shows a blank page

**Our Solution:** Show CSV content in a modal where users can manually Select All → Copy → Paste. This works 100% reliably on iOS 12.

#### DOM Elements

```html
<!-- Header button with badge -->
<button id="savedWordsBtn" class="icon-btn">
    <svg><!-- book icon --></svg>
    <span id="wordCount" class="word-count-badge">12</span>
</button>

<!-- Overlay (dims background) -->
<div id="panelOverlay" class="panel-overlay"></div>

<!-- Word List Panel (slides in from right) -->
<div id="wordListPanel" class="word-list-panel">
    <div class="word-list-header">
        <h3>Saved Words <span id="wordListCount">(0)</span></h3>
        <button id="closeWordListBtn">✕</button>
    </div>
    <div id="wordListContent" class="word-list-content">
        <!-- Rendered word items -->
    </div>
    <div class="word-list-actions">
        <button id="copyWordsBtn">Copy All</button>
        <button id="exportCsvBtn">Export CSV</button>
        <button id="clearWordsBtn">Clear</button>
    </div>
</div>

<!-- Export Modal -->
<div id="exportModal" class="export-modal">
    <div class="export-modal-content">
        <h3>Export CSV</h3>
        <textarea id="exportTextarea" readonly></textarea>
        <button id="selectAllBtn">Select All</button>
        <button id="closeExportBtn">Close</button>
    </div>
</div>
```

#### CSS Classes

| Class | Purpose |
|-------|---------|
| `.word-count-badge` | Red badge showing saved word count |
| `.word-list-panel` | Slide-in panel from right |
| `.word-list-panel.active` | Panel visible state |
| `.panel-overlay` | Semi-transparent backdrop |
| `.panel-overlay.active` | Overlay visible state |
| `.word-item` | Individual word entry in list |
| `.word-item-delete` | Delete button for single word |
| `.export-modal` | CSV export modal container |
| `.export-modal.active` | Modal visible state |
| `.export-textarea` | Monospace textarea for CSV |
| `.toast` | Toast notification |
| `.toast.show` | Toast visible state |
| `.action-btn` | Action buttons in panel |
| `.action-btn.primary` | Primary action (blue) |
| `.action-btn.danger` | Danger action (red) |

#### Functions Reference

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getSavedWords()` | none | Array | Get all saved words from localStorage |
| `setSavedWords(words)` | Array | void | Save words array to localStorage |
| `saveWord(word, definition, example)` | String, String, String | void | Add word if not duplicate |
| `deleteWord(index)` | Number | void | Remove word at index |
| `clearAllWords()` | none | void | Clear all (with confirmation) |
| `updateWordCountBadge()` | none | void | Update badge number |
| `renderWordList()` | none | void | Render word list HTML |
| `openWordListPanel()` | none | void | Show panel + overlay |
| `closeWordListPanel()` | none | void | Hide panel + overlay |
| `copyWordsToClipboard()` | none | void | Copy tab-separated to clipboard |
| `showExportModal()` | none | void | Show CSV modal |
| `closeExportModal()` | none | void | Hide CSV modal |
| `selectAllExportText()` | none | void | Select all text in textarea |
| `showToast(message)` | String | void | Show temporary notification |
| `escapeHtml(text)` | String | String | Escape HTML entities |

---

## Styling System

### CSS Variables

```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f9f6f1;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --text-muted: #95a5a6;
    --accent-primary: #3498db;
    --accent-hover: #2980b9;
    --border-color: #e0e0e0;
    --border-light: #ecf0f1;
    --popup-bg: #ffffff;
    --popup-shadow: rgba(0, 0, 0, 0.3);
}

body.dark-mode {
    --bg-primary: #1a1a1a;
    --bg-secondary: #0d0d0d;
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0a0;
    --text-muted: #808080;
    --accent-primary: #5dade2;
    --accent-hover: #3498db;
    --border-color: #404040;
    --border-light: #2a2a2a;
    --popup-bg: #1a1a1a;
    --popup-shadow: rgba(0, 0, 0, 0.8);
}
```

**Rule: Always use CSS variables for colors, never hardcode.**

### Responsive Breakpoints

| Breakpoint | Target Device |
|------------|---------------|
| `max-width: 480px` | Mobile phones (portrait) |
| `481px - 834px` | Mobile landscape + iPad mini portrait |
| `835px - 1024px` | iPad mini landscape + tablets |

### UI Preferences

- Use **modern minimal SVG icons** (not emojis)
- Icons use `currentColor` for theme compatibility
- Keep UI clean and minimal

---

## API Integration

### Mistral AI

```javascript
const MISTRAL_API_KEY = 'xxx';  // Line 1 of script.js

// Endpoint
POST https://api.mistral.ai/v1/chat/completions

// Model
'mistral-large-latest'
```

### Response Parsing

AI responses may include markdown; always strip it:

```javascript
function stripMarkdown(text) {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .trim();
}
```

---

## Common Patterns

### Null-Safe Property Access

```javascript
// ❌ WRONG
const value = obj?.nested?.property;

// ✅ RIGHT
const value = obj && obj.nested && obj.nested.property;

// ✅ OR with default
const value = (obj && obj.nested && obj.nested.property) || 'default';
```

### Event Handler with Context

```javascript
// ❌ WRONG (arrow functions can have issues in some contexts)
element.addEventListener('click', (e) => this.handleClick(e));

// ✅ RIGHT (explicit self reference)
var self = this;
element.addEventListener('click', function(e) {
    self.handleClick(e);
});
```

### Async File Reading

```javascript
// ✅ iOS 12 compatible FileReader pattern
function readFileAsArrayBuffer(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function readFileAsDataURL(blob) {
    return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onloadend = function() {
            resolve(reader.result);
        };
        reader.readAsDataURL(blob);
    });
}
```

### DOM Traversal with Parent Check

```javascript
// Check if node is inside a specific parent class
function isInsideClass(node, className) {
    var parent = node.parentNode;
    while (parent) {
        if (parent.classList && parent.classList.contains(className)) {
            return true;
        }
        parent = parent.parentNode;
    }
    return false;
}
```

### iOS 12 Safe Clipboard Copy

```javascript
// ✅ The ONLY reliable clipboard method for iOS 12
function copyTextToClipboard(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);

    // CRITICAL: setSelectionRange is required for iOS Safari
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);

    var success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Copy failed:', err);
    }

    document.body.removeChild(textarea);
    return success;
}
```

### Escape HTML to Prevent XSS

```javascript
// Always escape user-generated content before inserting into DOM
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

---

## Testing Checklist

### iOS 12 Specific Testing

- [ ] Test on actual iPad mini 3 or iOS 12 simulator
- [ ] No JavaScript console errors
- [ ] Touch interactions are responsive (no 300ms delay)
- [ ] Scrolling is smooth (-webkit-overflow-scrolling works)
- [ ] Text-to-speech works
- [ ] All images load correctly
- [ ] Dark mode toggle works
- [ ] Progress bar animates smoothly

### Functional Testing

- [ ] EPUB upload and parsing works
- [ ] Words are clickable and show definitions
- [ ] Summary buttons appear and work
- [ ] Scroll position persists across reload
- [ ] Dark mode preference persists
- [ ] Header hides on scroll down, shows on scroll up
- [ ] Popup dismisses on scroll or outside tap

### Saved Words & Export Testing

- [ ] Word badge count updates when word is saved
- [ ] Duplicate words are not saved twice
- [ ] Word list panel opens/closes correctly
- [ ] Individual word deletion works
- [ ] Clear all (with confirmation) works
- [ ] "Copy All" copies tab-separated text to clipboard
- [ ] "Export CSV" modal opens with correct CSV format
- [ ] "Select All" selects all text in export textarea
- [ ] Toast notifications appear and auto-dismiss
- [ ] All features work in dark mode
- [ ] Panel/modal close on overlay tap

### Performance Testing

- [ ] Large EPUB (100+ pages) doesn't crash
- [ ] Words wrap lazily (check with DevTools)
- [ ] No memory leaks on repeated EPUB loads
- [ ] Saving 100+ words doesn't slow down the app

---

## Quick Reference Card

### JavaScript: Safe vs Unsafe

| Want to do | ❌ Don't use | ✅ Use instead |
|------------|--------------|----------------|
| Safe property access | `obj?.prop` | `obj && obj.prop` |
| Default values | `x ?? 'default'` | `x !== undefined ? x : 'default'` |
| Flatten array | `arr.flat()` | `[].concat(...arr)` |
| Replace all | `str.replaceAll()` | `str.replace(/x/g, 'y')` |
| Last element | `arr.at(-1)` | `arr[arr.length - 1]` |
| File to buffer | `file.arrayBuffer()` | `FileReader.readAsArrayBuffer()` |
| Clipboard write | `navigator.clipboard.writeText()` | `document.execCommand('copy')` |

### CSS: Safe vs Unsafe

| Want to do | ❌ Don't use | ✅ Use instead |
|------------|--------------|----------------|
| Flex spacing | `gap: 10px` | margins on children |
| Aspect ratio | `aspect-ratio: 16/9` | padding-top percentage hack |
| Selector list | `:is(h1, h2)` | `h1, h2` (repeat styles) |
| Parent selector | `:has(.child)` | JavaScript |

---

## External Dependencies

| Dependency | CDN URL | Purpose |
|------------|---------|---------|
| JSZip 3.10.1 | cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js | EPUB unzipping |
| Bookerly Font | fonts.cdnfonts.com/css/bookerly | Reading typography |
