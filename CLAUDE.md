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

| Feature | Technology |
|---------|------------|
| Word Pronunciation | Web Speech API |
| Word Definitions | Mistral AI API |
| Section Summaries | Mistral AI API (every ~1000 words) |
| Dark Mode | CSS Variables + localStorage |
| Reading Progress | Scroll position in localStorage |

**Tech Stack:**
- Pure HTML/CSS/JavaScript (no build system)
- JSZip (CDN) for EPUB parsing
- Bookerly font (CDN)

---

## File Structure

```
myebookreader/
├── index.html      # HTML structure
├── script.js       # All JavaScript (~540 lines)
├── style.css       # All styles (~520 lines)
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
┌────────────────────────────────────────────────────────────┐
│                       index.html                            │
├──────────────┬─────────────────────┬───────────────────────┤
│    Header    │      Content        │   Popup (Bottom Sheet)│
│   (56px)     │    EPUB renders     │   Definitions/Summary │
│  - Upload    │    here with        │   - Drag handle       │
│  - Dark mode │    clickable words  │   - Scrollable content│
└──────────────┴─────────────────────┴───────────────────────┘
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
```

### Key Classes/Functions

| Name | Location | Purpose |
|------|----------|---------|
| `SpeechService` | script.js:3-58 | Web Speech API wrapper (IIFE pattern) |
| `processEPUB()` | script.js:159-298 | Main EPUB loading pipeline |
| `wrapWordsInElement()` | script.js:120-157 | Lazy word span wrapping |
| `divideSections()` | script.js:389-451 | Insert Summary buttons every ~1000 words |
| `callAI()` | script.js:300-324 | Mistral API wrapper |
| `handleWordClick()` | script.js:453-478 | Word tap handler |

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

## Styling System

### CSS Variables

```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f9f6f1;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --accent-primary: #3498db;
    --border-color: #e0e0e0;
    --popup-shadow: rgba(0, 0, 0, 0.3);
}

body.dark-mode {
    --bg-primary: #1a1a1a;
    --bg-secondary: #0d0d0d;
    --text-primary: #e0e0e0;
    /* ... overrides */
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

### Performance Testing

- [ ] Large EPUB (100+ pages) doesn't crash
- [ ] Words wrap lazily (check with DevTools)
- [ ] No memory leaks on repeated EPUB loads

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
