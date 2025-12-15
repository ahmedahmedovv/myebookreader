import { DB_NAME, DB_VERSION, STORE_NAME } from './constants';
import type { EpubMetadata } from '../types';

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      if (request.error && request.error.name === 'VersionError') {
        console.warn('[DB] Version mismatch, attempting to open with existing version');
        const fallbackRequest = indexedDB.open(DB_NAME);
        fallbackRequest.onerror = () => reject(fallbackRequest.error);
        fallbackRequest.onsuccess = () => {
          const db = fallbackRequest.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.close();
            const upgradeRequest = indexedDB.open(DB_NAME, DB_VERSION);
            upgradeRequest.onerror = () => reject(upgradeRequest.error);
            upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
            upgradeRequest.onupgradeneeded = (e) => {
              const upgradeDb = (e.target as IDBOpenDBRequest).result;
              if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
                upgradeDb.createObjectStore(STORE_NAME);
              }
            };
          } else {
            resolve(db);
          }
        };
      } else {
        reject(request.error);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        const upgradeRequest = indexedDB.open(DB_NAME, DB_VERSION);
        upgradeRequest.onerror = () => reject(upgradeRequest.error);
        upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
        upgradeRequest.onupgradeneeded = (e) => {
          const upgradeDb = (e.target as IDBOpenDBRequest).result;
          if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
            upgradeDb.createObjectStore(STORE_NAME);
          }
        };
      } else {
        resolve(db);
      }
    };

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveEpubFile(file: File): Promise<void> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      console.warn('Object store does not exist, cannot save EPUB');
      return;
    }
    const arrayBuffer = await file.arrayBuffer();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(arrayBuffer, 'current');
      request.onsuccess = () => {
        localStorage.setItem('epubFileName', file.name);
        localStorage.setItem('epubFileSize', file.size.toString());
        localStorage.setItem('epubFileLastModified', file.lastModified.toString());
        resolve();
      };
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    console.warn('Failed to save EPUB:', e);
  }
}

export async function loadEpubFile(): Promise<Blob | null> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      console.warn('Object store does not exist, cannot load EPUB');
      return null;
    }
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('current');
      request.onsuccess = () => {
        if (request.result) {
          const blob = new Blob([request.result], { type: 'application/epub+zip' });
          resolve(blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    console.warn('Failed to load EPUB:', e);
    return null;
  }
}

export function getEpubMetadata(): EpubMetadata | null {
  const fileName = localStorage.getItem('epubFileName');
  const fileSize = localStorage.getItem('epubFileSize');
  const lastModified = localStorage.getItem('epubFileLastModified');

  if (!fileName) return null;

  return {
    fileName,
    fileSize: fileSize ? parseInt(fileSize, 10) : 0,
    lastModified: lastModified ? parseInt(lastModified, 10) : 0,
  };
}

export function saveScrollPosition(scrollTop: number): void {
  localStorage.setItem('epubScrollPosition', scrollTop.toString());
}

export function getScrollPosition(): number {
  const saved = localStorage.getItem('epubScrollPosition');
  return saved ? parseInt(saved, 10) : 0;
}

