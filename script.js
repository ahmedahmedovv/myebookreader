const MISTRAL_API_KEY = 'UyFZtjZY3r5aNe1th2qtx6IBLynCc0ai'; // Replace with your actual API key

// SpeechService class using Web Speech API
var SpeechService = (function() {
    function SpeechService() {
        this.isSpeaking = false;
        this.speechRate = 1.0;
        this.currentUtterance = null;
    }

    SpeechService.prototype.speak = function(text, onEndCallback) {
        var self = this;

        // Stop any current speech
        this.stop();

        if (!window.speechSynthesis) {
            console.error('Web Speech API not supported');
            return;
        }

        this.isSpeaking = true;
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en';
        utterance.rate = this.speechRate;
        this.currentUtterance = utterance;

        utterance.onend = function() {
            self.isSpeaking = false;
            self.currentUtterance = null;
            if (onEndCallback) {
                onEndCallback();
            }
        };

        utterance.onerror = function(event) {
            console.error('Speech error:', event.error);
            self.isSpeaking = false;
            self.currentUtterance = null;
        };

        window.speechSynthesis.speak(utterance);
    };

    SpeechService.prototype.stop = function() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
    };

    SpeechService.prototype.setSpeechRate = function(rate) {
        this.speechRate = Math.max(0.5, Math.min(2.0, rate));
    };

    return SpeechService;
})();

// Initialize speech service
var speechService = new SpeechService();

// ========================================
// IndexedDB for storing last book
// ========================================
var BookStorage = (function() {
    var DB_NAME = 'EpubReaderDB';
    var DB_VERSION = 1;
    var STORE_NAME = 'books';
    var db = null;

    function openDB(callback) {
        if (db) {
            callback(null, db);
            return;
        }

        var request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = function(event) {
            console.error('IndexedDB error:', event.target.error);
            callback(event.target.error, null);
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            callback(null, db);
        };

        request.onupgradeneeded = function(event) {
            var database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    }

    function saveBook(fileName, arrayBuffer, callback) {
        openDB(function(err, database) {
            if (err) {
                if (callback) callback(err);
                return;
            }

            var transaction = database.transaction([STORE_NAME], 'readwrite');
            var store = transaction.objectStore(STORE_NAME);

            var bookData = {
                id: 'lastBook',
                fileName: fileName,
                data: arrayBuffer,
                savedAt: Date.now()
            };

            var request = store.put(bookData);

            request.onsuccess = function() {
                if (callback) callback(null);
            };

            request.onerror = function(event) {
                console.error('Failed to save book:', event.target.error);
                if (callback) callback(event.target.error);
            };
        });
    }

    function loadBook(callback) {
        openDB(function(err, database) {
            if (err) {
                callback(err, null);
                return;
            }

            var transaction = database.transaction([STORE_NAME], 'readonly');
            var store = transaction.objectStore(STORE_NAME);
            var request = store.get('lastBook');

            request.onsuccess = function(event) {
                var result = event.target.result;
                if (result) {
                    callback(null, result);
                } else {
                    callback(null, null);
                }
            };

            request.onerror = function(event) {
                console.error('Failed to load book:', event.target.error);
                callback(event.target.error, null);
            };
        });
    }

    return {
        saveBook: saveBook,
        loadBook: loadBook
    };
})();

const WORD_THRESHOLD = 1000;
let isBookLoaded = false;
let currentBookName = '';
let lastScrollY = 0;
const header = document.getElementById('header');
const content = document.getElementById('content');
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popupContent');
const epubInput = document.getElementById('epubInput');
const loadingBar = document.getElementById('loadingBar');
const loadingProgress = document.getElementById('loadingProgress');
const darkModeToggle = document.getElementById('darkModeToggle');
const uploadBtn = document.getElementById('uploadBtn');

// Saved words elements
const savedWordsBtn = document.getElementById('savedWordsBtn');
const wordCountBadge = document.getElementById('wordCount');
const wordListPanel = document.getElementById('wordListPanel');
const wordListContent = document.getElementById('wordListContent');
const wordListCount = document.getElementById('wordListCount');
const closeWordListBtn = document.getElementById('closeWordListBtn');
const copyWordsBtn = document.getElementById('copyWordsBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const clearWordsBtn = document.getElementById('clearWordsBtn');
const panelOverlay = document.getElementById('panelOverlay');
const exportModal = document.getElementById('exportModal');
const exportTextarea = document.getElementById('exportTextarea');
const selectAllBtn = document.getElementById('selectAllBtn');
const closeExportBtn = document.getElementById('closeExportBtn');

// Dark Mode Functionality
function initDarkMode() {
    // Check for saved preference or default to light mode
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');

    // Save preference
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Initialize dark mode on page load
initDarkMode();

// Dark mode toggle button
darkModeToggle.addEventListener('click', toggleDarkMode);

// Font Size Functionality
var MIN_FONT_SIZE = 14;
var MAX_FONT_SIZE = 26;
var FONT_STEP = 2;

function getCurrentFontSize() {
    var saved = localStorage.getItem('fontSize');
    if (saved) {
        var size = parseInt(saved, 10);
        if (!isNaN(size)) {
            return size;
        }
    }
    return 18; // Default
}

function setFontSize(size) {
    // Clamp to min/max
    if (size < MIN_FONT_SIZE) size = MIN_FONT_SIZE;
    if (size > MAX_FONT_SIZE) size = MAX_FONT_SIZE;

    // Apply to body
    if (document.body) {
        document.body.style.fontSize = size + 'px';
    }

    // Also apply directly to content element for iOS 12
    var contentEl = document.getElementById('content');
    if (contentEl) {
        contentEl.style.fontSize = size + 'px';
    }

    localStorage.setItem('fontSize', String(size));
    return size;
}

function initFontSize() {
    var size = getCurrentFontSize();
    setFontSize(size);
}

function increaseFontSize() {
    var current = getCurrentFontSize();
    if (current < MAX_FONT_SIZE) {
        setFontSize(current + FONT_STEP);
    }
}

function decreaseFontSize() {
    var current = getCurrentFontSize();
    if (current > MIN_FONT_SIZE) {
        setFontSize(current - FONT_STEP);
    }
}

// Initialize font size on page load
initFontSize();

// Font size button listeners (with null checks for safety)
(function() {
    var fontIncreaseBtn = document.getElementById('fontIncreaseBtn');
    var fontDecreaseBtn = document.getElementById('fontDecreaseBtn');

    if (fontIncreaseBtn) {
        fontIncreaseBtn.onclick = function(e) {
            e.preventDefault();
            increaseFontSize();
        };
    }

    if (fontDecreaseBtn) {
        fontDecreaseBtn.onclick = function(e) {
            e.preventDefault();
            decreaseFontSize();
        };
    }
})();

// Upload button triggers hidden file input
uploadBtn.addEventListener('click', () => {
    epubInput.click();
});

// Lazy Text Wrapping with IntersectionObserver
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.wrapped) {
            wrapWordsInElement(entry.target);
            entry.target.dataset.wrapped = 'true';
        }
    });
}, {
    rootMargin: '400px'
});

function wrapWordsInElement(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
        // Skip text nodes inside section-trigger buttons
        let parent = node.parentNode;
        let skipNode = false;
        while (parent && parent !== element) {
            if (parent.classList && parent.classList.contains('section-trigger')) {
                skipNode = true;
                break;
            }
            parent = parent.parentNode;
        }

        if (!skipNode && node.textContent.trim()) {
            textNodes.push(node);
        }
    }

    textNodes.forEach(textNode => {
        const words = textNode.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();
        words.forEach(word => {
            if (word.match(/\S/)) {
                const span = document.createElement('span');
                span.textContent = word;
                span.className = 'word';
                span.addEventListener('click', handleWordClick);
                fragment.appendChild(span);
            } else {
                fragment.appendChild(document.createTextNode(word));
            }
        });
        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

// EPUB Processing
// Process EPUB from File or ArrayBuffer
// Usage: processEPUB(file) or processEPUB(arrayBuffer, fileName)
async function processEPUB(fileOrBuffer, fileName) {
    var arrayBuffer;
    var isFromFile = fileOrBuffer instanceof File;

    if (isFromFile) {
        currentBookName = fileOrBuffer.name;
        // Read file to ArrayBuffer
        arrayBuffer = await new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) { resolve(e.target.result); };
            reader.onerror = reject;
            reader.readAsArrayBuffer(fileOrBuffer);
        });
        // Save to IndexedDB for auto-reload
        BookStorage.saveBook(currentBookName, arrayBuffer, function(err) {
            if (err) {
                console.error('Failed to save book to IndexedDB:', err);
            }
        });
    } else {
        // Already an ArrayBuffer (from IndexedDB)
        arrayBuffer = fileOrBuffer;
        currentBookName = fileName || 'book.epub';
    }

    loadingBar.style.display = 'block';
    loadingProgress.style.width = '0%';

    try {
        const zip = await JSZip.loadAsync(arrayBuffer);

        loadingProgress.style.width = '20%';

        // Extract all resources
        const htmlFiles = [];
        const cssFiles = {};
        const imageFiles = {};

        zip.forEach((relativePath, zipFile) => {
            if (relativePath.endsWith('.html') || relativePath.endsWith('.xhtml')) {
                htmlFiles.push(zipFile);
            } else if (relativePath.endsWith('.css')) {
                cssFiles[relativePath] = zipFile;
            } else if (relativePath.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
                imageFiles[relativePath] = zipFile;
            }
        });

        loadingProgress.style.width = '40%';

        // Load CSS files
        const cssDataMap = {};
        for (const [path, zipFile] of Object.entries(cssFiles)) {
            const cssText = await zipFile.async('text');
            const fileName = path.split('/').pop();
            cssDataMap[fileName] = cssText;
            cssDataMap[path] = cssText;
        }

        loadingProgress.style.width = '50%';

        // Load image files as data URLs
        const imageDataMap = {};
        for (const [path, zipFile] of Object.entries(imageFiles)) {
            const blob = await zipFile.async('blob');
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            const fileName = path.split('/').pop();
            imageDataMap[fileName] = dataUrl;
            imageDataMap[path] = dataUrl;
            // Also handle paths with "images/" prefix
            imageDataMap['images/' + fileName] = dataUrl;
        }

        loadingProgress.style.width = '60%';

        // Load and combine HTML content
        let allContent = '';
        for (const htmlFile of htmlFiles) {
            const text = await htmlFile.async('text');
            allContent += text;
        }

        loadingProgress.style.width = '70%';

        const parser = new DOMParser();
        const doc = parser.parseFromString(allContent, 'text/html');

        // Replace CSS links with inline styles
        const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
        linkTags.forEach(link => {
            const href = link.getAttribute('href');
            const fileName = href.split('/').pop();
            if (cssDataMap[fileName] || cssDataMap[href]) {
                const styleTag = doc.createElement('style');
                styleTag.textContent = cssDataMap[fileName] || cssDataMap[href];
                link.parentNode.replaceChild(styleTag, link);
            } else {
                link.remove(); // Remove broken CSS links
            }
        });

        // Replace image sources with data URLs
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
                const fileName = src.split('/').pop();
                if (imageDataMap[src] || imageDataMap[fileName]) {
                    img.src = imageDataMap[src] || imageDataMap[fileName];
                }
            }
        });

        const bodyContent = doc.body.innerHTML;

        loadingProgress.style.width = '80%';

        content.innerHTML = '';
        const sections = divideSections(bodyContent);
        content.innerHTML = sections;

        loadingProgress.style.width = '90%';

        // Observe all block elements for lazy wrapping (exclude section triggers)
        const blockElements = content.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li');
        blockElements.forEach(el => {
            if (!el.classList.contains('section-trigger')) {
                observer.observe(el);
            }
        });

        // Setup section summary handlers
        const summaryTriggers = content.querySelectorAll('.section-trigger');
        summaryTriggers.forEach(trigger => {
            trigger.addEventListener('click', handleSectionSummary);
        });

        loadingProgress.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.display = 'none';
        }, 500);

        isBookLoaded = true;
        restoreScrollPosition();

    } catch (error) {
        console.error('Error processing EPUB:', error);
        alert('Failed to load EPUB file. Please try another file.');
        loadingBar.style.display = 'none';
    }
}

// AI Integration
async function callAI(prompt, systemPrompt) {
    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI call failed:', error);
        return 'Failed to get response from AI. Please try again.';
    }
}

async function getWordDefinition(word) {
    var cleanWord = word.trim().replace(/[^\w'-]/g, '');
    if (!cleanWord || cleanWord.length < 2) {
        return { definition: 'Please click on a valid word to see its definition.', example: '' };
    }

    // Function to strip markdown formatting
    function stripMarkdown(text) {
        return text
            .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
            .replace(/\*([^*]+)\*/g, '$1')      // Remove *italics*
            .replace(/_([^_]+)_/g, '$1')        // Remove _italics_
            .replace(/`([^`]+)`/g, '$1')        // Remove `code`
            .trim();
    }

    // Function to parse AI response
    function parseResponse(response) {
        var definition = '';
        var example = '';

        var lines = response.split('\n').map(function(line) {
            return line.trim();
        }).filter(function(line) {
            return line;
        });

        // Check if response has labels
        var defMatch = response.match(/(?:definition|def):\s*(.+?)(?=\n|example:|$)/is);
        var exMatch = response.match(/(?:example|ex):\s*(.+?)$/is);

        if (defMatch && exMatch) {
            definition = stripMarkdown(defMatch[1]);
            example = stripMarkdown(exMatch[1]);
        } else if (lines.length >= 2) {
            definition = stripMarkdown(lines[0]);
            example = stripMarkdown(lines[1]);
        } else if (lines.length === 1) {
            definition = stripMarkdown(lines[0]);
        } else {
            definition = stripMarkdown(response);
        }

        return { definition: definition, example: example };
    }

    // Check if example contains the word (case-insensitive)
    function exampleContainsWord(example, targetWord) {
        if (!example) return false;
        var lowerExample = example.toLowerCase();
        var lowerWord = targetWord.toLowerCase();
        // Check for the word with word boundaries
        var regex = new RegExp('\\b' + lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        return regex.test(example);
    }

    var systemPrompt = 'You are a helpful English teacher assistant for language learners. Provide clear definitions and practical example sentences. The example sentence MUST always include the target word. Use plain text without any labels or markdown.';

    var maxAttempts = 2;
    var attempt = 0;
    var result = { definition: '', example: '' };

    while (attempt < maxAttempts) {
        attempt++;

        var prompt;
        if (attempt === 1) {
            prompt = 'For the word "' + cleanWord + '":\n' +
                '1. Provide a clear, simple dictionary-style definition in one sentence. Do not mention or repeat the word itself in the definition.\n' +
                '2. Provide an example sentence that MUST contain the exact word "' + cleanWord + '" to show how it is used in context.\n\n' +
                'Respond with just the definition on the first line and the example on the second line. Do not include labels like "Definition:" or "Example:". Do not use markdown formatting.';
        } else {
            // More explicit retry prompt
            prompt = 'For the word "' + cleanWord + '":\n' +
                '1. Definition: One sentence explaining the meaning (do NOT include the word "' + cleanWord + '" in the definition).\n' +
                '2. Example: A sentence that uses the EXACT word "' + cleanWord + '" - this is REQUIRED.\n\n' +
                'IMPORTANT: The example sentence MUST include "' + cleanWord + '" exactly as written.\n\n' +
                'Format: Definition on line 1, example on line 2. No labels, no markdown.';
        }

        var response = await callAI(prompt, systemPrompt);
        result = parseResponse(response);

        // Check if example contains the word
        if (exampleContainsWord(result.example, cleanWord)) {
            break; // Success, exit loop
        }

        // If last attempt and still no word in example, keep the result anyway
        if (attempt >= maxAttempts) {
            console.log('Word "' + cleanWord + '" not found in example after ' + maxAttempts + ' attempts');
        }
    }

    return result;
}

async function getSectionSummary(text) {
    if (!text || text.trim().length === 0) {
        return 'No text available to summarize.';
    }
    const truncatedText = text.substring(0, 5000);
    const prompt = `Summarize the following text in 7-8 sentences:\n\n${truncatedText}`;
    const systemPrompt = 'You are a helpful reading assistant. Provide clear, concise summaries.';
    return await callAI(prompt, systemPrompt);
}

// Divide content into sections with summary triggers
function divideSections(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    let wordCount = 0;
    let sectionText = '';
    const resultHTML = [];

    function getTextContent(node) {
        let text = '';
        if (node.nodeType === Node.TEXT_NODE) {
            text = node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(child => {
                text += getTextContent(child);
            });
        }
        return text;
    }

    function processNode(node, parent) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Check if this text node is inside a style or script tag
            let parentElement = node.parentNode;
            let skipText = false;
            while (parentElement) {
                if (parentElement.nodeName === 'STYLE' || parentElement.nodeName === 'SCRIPT') {
                    skipText = true;
                    break;
                }
                parentElement = parentElement.parentNode;
            }

            if (!skipText) {
                const words = node.textContent.split(/\s+/).filter(w => w.trim());
                wordCount += words.length;
                sectionText += node.textContent;
            }

            parent.appendChild(node.cloneNode(true));

            if (wordCount >= WORD_THRESHOLD) {
                const trigger = document.createElement('button');
                trigger.className = 'section-trigger';
                trigger.textContent = 'Summary';
                trigger.dataset.summaryText = sectionText;
                parent.appendChild(trigger);
                wordCount = 0;
                sectionText = '';
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);
            parent.appendChild(clone);
            Array.from(node.childNodes).forEach(child => processNode(child, clone));
        }
    }

    const result = document.createElement('div');
    Array.from(tempDiv.childNodes).forEach(child => processNode(child, result));

    return result.innerHTML;
}

// Event Handlers
async function handleWordClick(e) {
    const word = e.target.textContent.trim();

    // Validate that the word is not empty or just punctuation
    const cleanWord = word.replace(/[^\w'-]/g, '');
    if (!cleanWord || cleanWord.length < 2) {
        return; // Don't open popup for invalid words
    }

    // Speak the word immediately
    speechService.speak(cleanWord);

    popupContent.innerHTML = '<div class="loading">Loading definition...</div>';
    popup.classList.add('active');

    const result = await getWordDefinition(word);

    let html = '<h3>' + cleanWord + '</h3>';
    html += '<p class="definition">' + result.definition + '</p>';
    if (result.example) {
        html += '<p class="example"><em>' + result.example + '</em></p>';
    }

    popupContent.innerHTML = html;

    // Auto-save the word with its definition
    if (result.definition && result.definition !== 'Please click on a valid word to see its definition.') {
        saveWord(cleanWord, result.definition, result.example);
    }
}

async function handleSectionSummary(e) {
    const text = e.target.dataset.summaryText;
    popupContent.innerHTML = '<div class="loading">Generating summary...</div>';
    popup.classList.add('active');

    const summary = await getSectionSummary(text);
    popupContent.innerHTML = '<h3>Section Summary</h3><p>' + summary + '</p>';
}

// Close popup when clicking outside content area
popup.addEventListener('click', (e) => {
    if (e.target === popup) {
        popup.classList.remove('active');
        speechService.stop();
    }
});

// Scroll Persistence
function saveScrollPosition() {
    if (isBookLoaded && currentBookName) {
        localStorage.setItem(`scroll_${currentBookName}`, window.scrollY);
    }
}

function restoreScrollPosition() {
    if (currentBookName) {
        const savedPosition = localStorage.getItem(`scroll_${currentBookName}`);
        if (savedPosition) {
            window.scrollTo(0, parseInt(savedPosition));
        }
    }
}

// Auto-hide header on scroll
window.addEventListener('scroll', () => {
    if (!isBookLoaded) return;

    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
    }
    lastScrollY = currentScrollY;

    // Hide popup when scrolling and stop speech
    popup.classList.remove('active');
    speechService.stop();

    saveScrollPosition();
});

// ========================================
// Saved Words Functionality
// ========================================

// Get saved words from localStorage
function getSavedWords() {
    try {
        return JSON.parse(localStorage.getItem('savedWords') || '[]');
    } catch (e) {
        return [];
    }
}

// Save words to localStorage
function setSavedWords(words) {
    localStorage.setItem('savedWords', JSON.stringify(words));
    updateWordCountBadge();
}

// Add a word to saved list
function saveWord(word, definition, example) {
    var saved = getSavedWords();
    var lowerWord = word.toLowerCase();

    // Check for duplicates
    var exists = saved.some(function(item) {
        return item.word.toLowerCase() === lowerWord;
    });

    if (!exists) {
        saved.push({
            word: word,
            definition: definition || '',
            example: example || '',
            timestamp: Date.now(),
            bookName: currentBookName || ''
        });
        setSavedWords(saved);
    }
}

// Delete a word from saved list
function deleteWord(index) {
    var saved = getSavedWords();
    if (index >= 0 && index < saved.length) {
        saved.splice(index, 1);
        setSavedWords(saved);
        renderWordList();
    }
}

// Clear all saved words
function clearAllWords() {
    if (confirm('Delete all saved words? This cannot be undone.')) {
        setSavedWords([]);
        renderWordList();
        showToast('All words cleared');
    }
}

// Update the badge count
function updateWordCountBadge() {
    var count = getSavedWords().length;
    if (count > 0) {
        wordCountBadge.textContent = count > 99 ? '99+' : count;
        wordCountBadge.style.display = 'flex';
    } else {
        wordCountBadge.style.display = 'none';
    }
}

// Render the word list panel
function renderWordList() {
    var saved = getSavedWords();
    wordListCount.textContent = '(' + saved.length + ')';

    if (saved.length === 0) {
        wordListContent.innerHTML =
            '<div class="word-list-empty">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>' +
                    '<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>' +
                '</svg>' +
                '<p>No words saved yet.<br>Tap any word while reading to save it.</p>' +
            '</div>';
        return;
    }

    var html = '';
    saved.forEach(function(item, index) {
        var def = item.definition || '';
        if (def.length > 100) {
            def = def.substring(0, 100) + '...';
        }
        html +=
            '<div class="word-item">' +
                '<div class="word-item-header">' +
                    '<span class="word-item-word">' + escapeHtml(item.word) + '</span>' +
                    '<button class="word-item-delete" data-index="' + index + '" aria-label="Delete word">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                            '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                            '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                        '</svg>' +
                    '</button>' +
                '</div>' +
                '<p class="word-item-definition">' + escapeHtml(def) + '</p>' +
            '</div>';
    });
    wordListContent.innerHTML = html;

    // Add delete handlers
    var deleteButtons = wordListContent.querySelectorAll('.word-item-delete');
    deleteButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var index = parseInt(this.getAttribute('data-index'), 10);
            deleteWord(index);
        });
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open word list panel
function openWordListPanel() {
    renderWordList();
    wordListPanel.classList.add('active');
    panelOverlay.classList.add('active');
}

// Close word list panel
function closeWordListPanel() {
    wordListPanel.classList.remove('active');
    panelOverlay.classList.remove('active');
}

// Copy words to clipboard (iOS 12 compatible)
function copyWordsToClipboard() {
    var saved = getSavedWords();

    if (saved.length === 0) {
        showToast('No words to copy');
        return;
    }

    // Tab-separated format for Anki/Quizlet
    var text = saved.map(function(item) {
        return item.word + '\t' + (item.definition || '') + '\t' + (item.example || '');
    }).join('\n');

    // Save scroll position before focus changes it
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // iOS 12 compatible clipboard method
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    textarea.style.top = scrollTop + 'px';
    document.body.appendChild(textarea);

    // iOS specific: use setSelectionRange
    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);

    var success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Copy failed:', err);
    }

    document.body.removeChild(textarea);

    // Restore scroll position (iOS Safari may have moved it)
    window.scrollTo(0, scrollTop);

    if (success) {
        showToast('Copied ' + saved.length + ' words! Paste into Anki or Quizlet.');
    } else {
        showToast('Copy failed. Try Export CSV instead.');
    }
}

// Detect iOS version (returns 0 if not iOS)
function getIOSVersion() {
    var match = navigator.userAgent.match(/OS (\d+)_/i);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    // Check for iPad on iOS 13+ (reports as Mac)
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
        return 13; // iOS 13+ iPads report as Mac
    }
    return 0; // Not iOS
}

// Check if file download is supported (not iOS 12 or earlier)
function canDownloadFiles() {
    var iosVersion = getIOSVersion();
    // iOS 12 and earlier don't support download attribute
    if (iosVersion > 0 && iosVersion < 13) {
        return false;
    }
    return true;
}

// Generate JSON content from saved words (matching flashcard app format)
function generateJSON() {
    var saved = getSavedWords();
    var cards = saved.map(function(item) {
        return {
            w: item.word || '',
            d: item.definition || '',
            s: item.example || '',
            int: 1,       // Default interval for new card
            due: 0,       // Not scheduled yet
            ef: 2.5,      // Default SM-2 easiness factor
            n: 0,         // No repetitions yet
            lang: 'en'    // English
        };
    });

    var exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        language: 'English',
        languageCode: 'en',
        cardCount: cards.length,
        cards: cards
    };

    return JSON.stringify(exportData, null, 2);
}

// Download JSON file (for modern browsers)
function downloadJSON(json, filename) {
    var blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    var url = URL.createObjectURL(blob);

    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 100);

    return true;
}

// Copy JSON to clipboard (iOS 12 compatible fallback)
function copyJSONToClipboard(json) {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    var textarea = document.createElement('textarea');
    textarea.value = json;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    textarea.style.top = scrollTop + 'px';
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.setSelectionRange(0, textarea.value.length);

    var success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Copy failed:', err);
    }

    document.body.removeChild(textarea);
    window.scrollTo(0, scrollTop);

    return success;
}

// Export JSON - tries download first, falls back to clipboard
function exportJSON() {
    var saved = getSavedWords();

    if (saved.length === 0) {
        showToast('No words to export');
        return;
    }

    var json = generateJSON();
    var filename = 'saved-words.json';

    // Add book name to filename if available
    if (currentBookName) {
        var bookBase = currentBookName.replace(/\.epub$/i, '').replace(/[^a-zA-Z0-9]/g, '-');
        filename = bookBase + '-words.json';
    }

    if (canDownloadFiles()) {
        // Modern browser - download file directly
        downloadJSON(json, filename);
        showToast('Downloaded ' + filename);
    } else {
        // iOS 12 fallback - copy to clipboard
        var success = copyJSONToClipboard(json);
        if (success) {
            showToast('JSON copied! Paste into Notes or Files app.');
        } else {
            // Ultimate fallback - show modal
            showExportModal();
        }
    }
}

// Show export JSON modal (fallback for when copy fails)
function showExportModal() {
    var json = generateJSON();
    exportTextarea.value = json;
    exportModal.classList.add('active');
}

// Close export modal
function closeExportModal() {
    exportModal.classList.remove('active');
}

// Select all text in export textarea
function selectAllExportText() {
    exportTextarea.focus();
    exportTextarea.setSelectionRange(0, exportTextarea.value.length);

    // Auto-copy after selection (iOS 12 compatible)
    var success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Auto-copy failed:', err);
    }

    if (success) {
        showToast('Copied to clipboard!');
    } else {
        showToast('Text selected. Now copy with Cmd+C or long-press.');
    }
}

// Show toast notification
function showToast(message) {
    // Remove existing toast if any
    var existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(function() {
        toast.classList.add('show');
    }, 10);

    // Auto-hide after 2.5 seconds
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 100);
    }, 500);
}

// Event listeners for saved words
savedWordsBtn.addEventListener('click', openWordListPanel);
closeWordListBtn.addEventListener('click', closeWordListPanel);
panelOverlay.addEventListener('click', closeWordListPanel);
copyWordsBtn.addEventListener('click', copyWordsToClipboard);
exportCsvBtn.addEventListener('click', exportJSON);
clearWordsBtn.addEventListener('click', clearAllWords);
selectAllBtn.addEventListener('click', selectAllExportText);
closeExportBtn.addEventListener('click', closeExportModal);

// Close export modal on backdrop click
exportModal.addEventListener('click', function(e) {
    if (e.target === exportModal) {
        closeExportModal();
    }
});

// Initialize word count badge on page load
updateWordCountBadge();

// ========================================
// File Input Handler
// ========================================

// File input handler
epubInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        processEPUB(file);
    }
});

// ========================================
// Auto-load last book on page start
// ========================================
(function() {
    BookStorage.loadBook(function(err, bookData) {
        if (err) {
            console.error('Failed to load last book:', err);
            return;
        }

        if (bookData && bookData.data && bookData.fileName) {
            // Auto-load the last book
            processEPUB(bookData.data, bookData.fileName);
        }
    });
})();
