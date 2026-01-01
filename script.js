const API_KEY = 'UyFZtjZY3r5aNe1th2qtx6IBLynCc0ai';
const WORD_THRESHOLD = 1000;

const out = document.getElementById('out');
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');
const progressBar = document.getElementById('progress');
const controls = document.getElementById('controls');

let lastScrollTop = 0;
let scrollDebounce;
let isBookLoaded = false;

// 1. INTERSECTION OBSERVER
const wordObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.wrapped) {
            wrapTextInBlock(entry.target);
            entry.target.dataset.wrapped = "true";
        }
    });
}, { rootMargin: '400px' });

function wrapTextInBlock(element) {
    if (element.classList.contains('summary-trigger')) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    const nodes = [];
    while(node = walker.nextNode()) nodes.push(node);

    nodes.forEach(textNode => {
        const fragment = document.createDocumentFragment();
        const temp = document.createElement('span');
        temp.innerHTML = textNode.textContent.replace(/(\S+)/g, '<span class="word">$1</span>');
        while (temp.firstChild) fragment.appendChild(temp.firstChild);
        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

// 2. EPUB PROCESSING
async function handleFile(file) {
    if (!file) return;
    isBookLoaded = true;
    progressBar.style.width = '20%';
    
    const zip = await JSZip.loadAsync(file);
    let combinedHtml = "";
    
    const htmlFiles = Object.keys(zip.files).filter(path => path.match(/\.(x?html?)$/)).sort();
    for (let path of htmlFiles) {
        combinedHtml += await zip.files[path].async("string");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(combinedHtml, 'text/html');
    processSections(doc.body);

    out.innerHTML = doc.body.innerHTML;
    progressBar.style.width = '100%';

    Array.from(out.children).forEach(child => wordObserver.observe(child));
    
    setTimeout(() => {
        window.scrollTo(0, localStorage.getItem('scroll_' + file.name) || 0);
        progressBar.style.width = '0%';
    }, 100);
}

function processSections(container) {
    let wordCount = 0;
    let sectionBuffer = "";
    const children = Array.from(container.children);

    children.forEach(child => {
        const text = child.textContent;
        const count = text.split(/\s+/).filter(w => w.length > 0).length;
        wordCount += count;
        sectionBuffer += text + " ";

        if (wordCount >= WORD_THRESHOLD) {
            const trigger = document.createElement('div');
            trigger.className = 'summary-trigger';
            trigger.innerHTML = "✦ ✦ ✦ ✦ ✦";
            trigger.dataset.summaryText = sectionBuffer.trim();
            child.after(trigger);
            wordCount = 0;
            sectionBuffer = "";
        }
    });
}

// 3. AI API CALLS
async function callAI(prompt) {
    const resp = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`},
        body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [{role: 'user', content: prompt}]
        })
    });
    const data = await resp.json();
    return data.choices[0].message.content;
}

async function handleWordClick(word) {
    const cleanWord = word.replace(/[^\w]/g, '');
    popupContent.innerHTML = `<em>Defining "${cleanWord}"...</em>`;
    popup.style.display = 'block';

    try {
        const definition = await callAI(`Define "${cleanWord}" in one sentence.`);
        const example = await callAI(`Provide a single clear sentence using the word "${cleanWord}" in context.`);
        popupContent.innerHTML = `<strong>${cleanWord}</strong><p>${definition}</p><p><em>${example}</em></p>`;
    } catch (e) {
        popupContent.innerHTML = "Error fetching definition.";
    }
}

async function handleSummaryClick(trigger) {
    const text = trigger.dataset.summaryText;
    popupContent.innerHTML = `<em>Generating AI summary...</em>`;
    popup.style.display = 'block';

    try {
        const summary = await callAI(`Summarize this ebook section in 7-8 concise sentences, with no introduction or extra explanation:\n\n"${text.substring(0, 5000)}"`);
        popupContent.innerHTML = `<p>${summary.replace(/\n/g, '<br>')}</p>`;
    } catch (e) { popupContent.innerHTML = "Error generating summary."; }
}

// 4. EVENTS
out.addEventListener('click', e => {
    if (e.target.classList.contains('word')) {
        document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
        e.target.classList.add('highlighted');
        handleWordClick(e.target.textContent);
    } else if (e.target.classList.contains('summary-trigger')) {
        handleSummaryClick(e.target);
    }
});

function closePopup() { popup.style.display = 'none'; }

window.onscroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (isBookLoaded) {
        if (scrollTop > lastScrollTop && scrollTop > 50) {
            controls.classList.add('header-hidden');
        } else {
            controls.classList.remove('header-hidden');
        }
    }
    lastScrollTop = scrollTop;
    if (popup.style.display === 'block') closePopup();

    clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(() => {
        const file = document.querySelector('input').files[0];
        if (file) localStorage.setItem('scroll_' + file.name, window.scrollY);
    }, 200);
};