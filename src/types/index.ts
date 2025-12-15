export interface EpubFile {
  name: string;
  size: number;
  lastModified: number;
  data: ArrayBuffer;
}

export interface Definition {
  word: string;
  definition: string;
  example?: string;
}

export interface Summary {
  text: string;
  summary: string;
}

export interface EpubMetadata {
  fileName: string;
  fileSize: number;
  lastModified: number;
}

export interface EpubContent {
  html: string;
  opfDir: string;
}

export interface WordElement extends HTMLSpanElement {
  textContent: string;
}

declare global {
  interface Window {
    JSZip: any;
  }
}

