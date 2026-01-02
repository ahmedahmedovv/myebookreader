# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered EPUB reader with interactive features. It's a client-side web application that uses Mistral AI for word definitions (with example sentences) and section summaries. The application has no build system or dependencies - it's pure HTML/CSS/JS with CDN-loaded libraries.

## Development Setup

This is a static web application with no build system. To develop:

```bash
# Serve locally (use any static server)
python -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000

## Architecture

### Core Files

- **index.html**: Minimal icon bar header, hidden file input, content area, bottom-sheet popup (no close button). Loads JSZip from CDN for EPUB parsing.
- **script.js**: All application logic (~420 lines)
- **style.css**: CSS variables for dark mode theming, fully responsive styling with mobile/tablet breakpoints

### Key Technical Implementation

**EPUB Processing Flow**:
1. File read via FileReader (for browser compatibility) instead of `file.arrayBuffer()`
2. Unzip with JSZip to extract HTML, CSS, and images
3. Convert CSS links to inline `<style>` tags
4. Convert image sources to data URLs via FileReader
5. Parse HTML with DOMParser and extract body content
6. Divide into sections with "Summary" button triggers every 1000 words

**Lazy Text Wrapping** (script.js:~49-83):
- Uses IntersectionObserver with 400px rootMargin
- Each block element (p, div, h1-h6, li) observed separately
- Words wrapped in clickable `<span class="word">` only when entering viewport
- Critical for performance on large EPUBs (prevents DOM bloat)
- Elements marked with `dataset.wrapped = 'true'` after processing
- **IMPORTANT**: Section trigger buttons are explicitly excluded from wrapping to prevent their text from becoming clickable

**Section Division** (script.js:~275-340):
- Traverses DOM tree recursively, accumulating text nodes
- **Skips text inside `<style>` and `<script>` tags** to prevent CSS/JS code in summaries
- Inserts `<button class="section-trigger">Summary</button>` elements every ~1000 words
- Stores accumulated section text in `button.dataset.summaryText`
- Must maintain proper parent-child DOM relationships during traversal

**Resource Handling**:
- Creates maps for CSS files (by filename and full path)
- Creates maps for images (by filename, full path, and "images/" prefix)
- All paths handled with multiple lookup strategies to catch different EPUB structures

**AI Integration**:
- API key in script.js:1 (client-side only, no backend)
- Single `callAI()` function handles all Mistral API calls
- Model: `mistral-large-latest`
- **Word definitions**: Returns `{definition, example}` object with markdown stripping
  - Prompt explicitly requests no labels or markdown formatting
  - Response parser handles both labeled and unlabeled formats
  - Strips `**bold**`, `*italic*`, `_underline_`, and backticks
- **Section summaries**: 7-8 sentences, text truncated to 5000 chars before sending

**Dark Mode**:
- CSS variables in `:root` and `body.dark-mode` for all colors
- Preference saved to localStorage as 'darkMode': 'enabled'/'disabled'
- Auto-initializes on page load via `initDarkMode()`
- Affects all UI elements: header, content, popup, borders, shadows, interactive states

**UI Interactions**:
- Scroll automatically hides popup (primary dismiss method)
- Clicking outside popup content dismisses it (secondary method)
- No close button needed
- Upload button (icon-only 📁) triggers hidden file input
- Dark mode toggle (☀️/🌙 icon swap) saves preference

**Scroll Persistence**:
- Saves position to localStorage keyed by book filename
- Only saves when `isBookLoaded === true`
- Auto-restores on book load

**Auto-hiding Header**:
- Minimal icon bar design (56px height)
- Tracks scroll direction via `lastScrollY` comparison
- Hides header on downward scroll (when scrollY > 100px)
- Only active when `isBookLoaded === true`

## Responsive Design

Three breakpoint ranges:
1. **Mobile Portrait (≤480px)**: Icon buttons 36px, 80vh popup
2. **Mobile Landscape/iPad Mini Portrait (481-834px)**: Icon buttons 38px, 75vh popup
3. **iPad Mini Landscape/Tablets (835-1024px)**: Icon buttons 40px, 70vh popup

Key mobile optimizations:
- 36-40px minimum tap targets for icon buttons
- Touch feedback with `:active` states
- Safe area insets for notched devices
- `-webkit-overflow-scrolling: touch` for iOS
- Removed tap highlights with `-webkit-tap-highlight-color: transparent`

## Styling Architecture

**External Dependencies**: Bookerly font from cdnfonts.com

**CSS Variables Pattern**: All colors managed via CSS custom properties for easy dark mode theming. Variables include: `--bg-primary`, `--text-primary`, `--accent-primary`, `--border-color`, etc.

**Layout Pattern**:
- Fixed minimal icon bar header (56px, 1px bottom border, no shadow)
- Centered content container (max-width: 800px)
- Fixed bottom-sheet popup with slide-up animation (no header, no close button)

**Interactive Elements**:
- `.word` spans: clickable with hover/active states, color changes to `--accent-primary`
- `.section-trigger`: Pill-shaped buttons (border-radius: 24px), ghost style with border, hover lift effect
- `.icon-btn`: 40x40px transparent buttons in header, subtle hover backgrounds
- Bottom sheet: 70-80vh max height, rounded top corners, backdrop shadow

## Important Constraints

- **Target Device: iPad mini 3 running iOS 12** - All code must be compatible with iOS 12 Safari browser (released 2018). Avoid modern ES6+ features not supported in iOS 12.
- No build process or bundler - direct file editing
- All dependencies loaded via CDN (JSZip, Bookerly font)
- FileReader used instead of modern file APIs for compatibility (iOS 12 requirement)
- EPUB images/CSS embedded as data URLs/inline styles (no external references)
- API key intentionally in client code (no backend)

## Critical Implementation Notes

1. **iOS 12 Compatibility**: This project targets iPad mini 3 with iOS 12 Safari. When adding features or refactoring:
   - Avoid modern APIs not available in iOS 12 (e.g., optional chaining `?.`, nullish coalescing `??`, `async`/`await` in some contexts)
   - Test CSS features for iOS 12 compatibility (some modern CSS grid/flexbox features may need fallbacks)
   - Use FileReader API instead of modern file handling APIs
   - Keep JavaScript ES5/ES6 compatible - avoid ES2019+ features
2. **Word Wrapping Exclusions**: Always check if text nodes are inside `.section-trigger` buttons or `<style>`/`<script>` tags before wrapping
3. **AI Response Parsing**: Word definitions must handle both labeled ("Definition: ...") and unlabeled formats, always strip markdown
4. **Popup Dismissal**: Scroll-to-dismiss is primary UX pattern, no close button needed
5. **Dark Mode Variables**: Always use CSS variables for colors, never hardcoded hex values
6. **Icon-Only Header**: All header buttons are icon-only (no text), use `aria-label` and `title` for accessibility
