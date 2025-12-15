// JSZip is loaded from CDN
declare const JSZip: any;
import { CONFIG } from './constants';
import type { EpubContent } from '../types';

let currentZip: any | null = null;
let opfDir = '';

export function getCurrentZip(): any | null {
  return currentZip;
}

export function getOpfDir(): string {
  return opfDir;
}

export function resolvePath(basePath: string, relativePath: string): string {
  if (relativePath.startsWith('/')) {
    return relativePath.substring(1);
  }
  const baseDir = basePath.substring(0, basePath.lastIndexOf('/') + 1);
  const parts = (baseDir + relativePath).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.' && part !== '') {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

export async function fixImages(htmlContent: string, contentPath: string): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');

  if (!currentZip) {
    return htmlContent;
  }

  for (const img of images) {
    const src = img.getAttribute('src');
    if (src) {
      const imagePath = resolvePath(contentPath, src);
      try {
        const imageData = await currentZip.file(imagePath)?.async('base64');
        if (imageData) {
          const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                         imagePath.toLowerCase().endsWith('.gif') ? 'image/gif' :
                         'image/jpeg';
          img.src = 'data:' + mimeType + ';base64,' + imageData;
        }
      } catch (e) {
        console.warn('Image not found:', imagePath);
      }
    }
  }

  const body = doc.querySelector('body');
  return body ? body.innerHTML : htmlContent;
}

export function insertSummaryMarkers(htmlContent: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const body = doc.querySelector('body');

  if (!body) return htmlContent;

  const walker = document.createTreeWalker(
    body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parent = node.parentNode;
        if (parent && parent instanceof Element && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let charCount = 0;
  const boundaryElements = new Set<Element>();

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    const startCount = charCount;
    charCount += text.length;

    const startBoundary = Math.floor(startCount / CONFIG.SUMMARY_INTERVAL);
    const endBoundary = Math.floor(charCount / CONFIG.SUMMARY_INTERVAL);

    if (endBoundary > startBoundary) {
      let element: Element | null = node.parentElement;
      while (element && element !== body) {
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'].includes(element.tagName)) {
          boundaryElements.add(element);
          break;
        }
        element = element.parentElement;
      }
    }
  }

  boundaryElements.forEach((element) => {
    const summaryDiv = doc.createElement('div');
    summaryDiv.className = 'summary-marker';
    summaryDiv.innerHTML = `
      <div class="summary-marker-line"></div>
      <div class="summary-marker-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 18H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="summary-marker-line"></div>
    `;
    element.appendChild(summaryDiv);
  });

  return body.innerHTML;
}

export async function loadEpubContent(file: File | Blob): Promise<EpubContent> {
  if (typeof window.JSZip === 'undefined') {
    throw new Error('JSZip library not loaded. Please check your internet connection.');
  }

  currentZip = await JSZip.loadAsync(file);
  const container = await currentZip.file('META-INF/container.xml')?.async('string');
  
  if (!container) {
    throw new Error('Invalid EPUB: container.xml not found');
  }

  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(container, 'text/xml');
  const rootfile = containerDoc.querySelector('rootfile');
  
  if (!rootfile) {
    throw new Error('Invalid EPUB: container.xml missing rootfile');
  }

  const opfPath = rootfile.getAttribute('full-path');
  if (!opfPath) {
    throw new Error('Invalid EPUB: rootfile missing full-path');
  }

  const opf = await currentZip.file(opfPath)?.async('string');
  if (!opf) {
    throw new Error('Invalid EPUB: OPF file not found');
  }

  const opfDoc = parser.parseFromString(opf, 'text/xml');
  opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

  const manifest = opfDoc.querySelectorAll('manifest item');
  const spine = opfDoc.querySelectorAll('spine itemref');

  if (manifest.length === 0) {
    throw new Error('Invalid EPUB: no manifest items found');
  }

  const items: Record<string, string> = {};
  manifest.forEach(item => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) {
      items[id] = opfDir + href;
    }
  });

  let html = '';
  for (const item of spine) {
    const idref = item.getAttribute('idref');
    const filePath = idref ? items[idref] : null;
    if (filePath) {
      try {
        const content = await currentZip.file(filePath)?.async('string');
        if (content) {
          const fixedContent = await fixImages(content, filePath);
          html += fixedContent;
        }
      } catch (e) {
        console.warn('Error loading content file:', filePath, e);
      }
    }
  }

  if (!html) {
    throw new Error('No content found in EPUB');
  }

  html = insertSummaryMarkers(html);

  return { html, opfDir };
}

