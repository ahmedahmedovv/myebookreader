import { MISTRAL_API_KEY } from './constants';
import type { Definition } from '../types';

export async function getWordDefinition(word: string, isOnline: boolean): Promise<Definition> {
  const cacheKey = `definition:${word.toLowerCase()}`;
  const cachedDef = localStorage.getItem(cacheKey);
  
  // Always check cache first - return immediately if cached
  if (cachedDef) {
    const cached = JSON.parse(cachedDef);
    return {
      word,
      definition: cached.definition,
      example: cached.example,
    };
  }

  if (!isOnline) {
    throw new Error('You are offline. No cached definition available.');
  }

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-tiny',
      messages: [
        {
          role: 'user',
          content: `For the word "${word}", provide:
1. A brief, simple definition in one sentence.
2. A simple example sentence using the word.

Format your response as:
Definition: [definition]
Example: [example sentence]`
        }
      ],
      max_tokens: 150
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get definition');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  let definition = '';
  let example = '';

  const definitionMatch = content.match(/Definition:\s*(.+?)(?:\n|Example:|$)/i);
  const exampleMatch = content.match(/Example:\s*(.+?)$/i);

  if (definitionMatch) {
    definition = definitionMatch[1].trim();
  } else {
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim());
    definition = sentences[0] ? sentences[0].trim() : content.split('\n')[0].trim();
  }

  if (exampleMatch) {
    example = exampleMatch[1].trim();
  } else {
    const exampleLine = content.split('\n').find((line: string) =>
      line.toLowerCase().includes('example') ||
      (line.includes(word) && line.length > word.length + 10)
    );
    example = exampleLine ? exampleLine.replace(/^.*?example:?\s*/i, '').trim() : '';
  }

  localStorage.setItem(cacheKey, JSON.stringify({ definition, example }));

  return { word, definition, example };
}

export async function generateSummary(text: string, isOnline: boolean): Promise<string> {
  if (!text || text.length < 100) {
    throw new Error('Not enough text to summarize');
  }

  const textHash = text.substring(0, 100).replace(/\s/g, '').toLowerCase();
  const cacheKey = `summary:${textHash}`;
  const cachedSummary = localStorage.getItem(cacheKey);

  if (cachedSummary && !isOnline) {
    return cachedSummary;
  }

  if (!isOnline) {
    if (cachedSummary) {
      return cachedSummary;
    }
    throw new Error('You are offline. No cached summary available.');
  }

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-tiny',
      messages: [
        {
          role: 'user',
          content: `Summarize the following text in 5-6 sentences:\n\n${text}`
        }
      ],
      max_tokens: 500
    })
  });

  if (!response.ok) {
    if (cachedSummary) {
      return cachedSummary;
    }
    throw new Error('Failed to generate summary');
  }

  const data = await response.json();
  const summary = data.choices[0].message.content;

  localStorage.setItem(cacheKey, summary);

  return summary;
}

export function removeWordDefinition(word: string): void {
  const cacheKey = `definition:${word.toLowerCase()}`;
  localStorage.removeItem(cacheKey);
}

