import React from 'react';

// Funciones de formato compartidas por App.tsx y ResultadosExpediente.tsx.

export function toSentenceCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// Convierte cualquier valor a string seguro para renderizar en JSX.
// Protege contra datos viejos o respuestas del modelo donde un campo de texto
// llegó como objeto (causa del error React #31 / pantalla en blanco).
export function renderBold(text: string): React.ReactNode {
  if (!text.includes('**')) return text;
  const parts = text.split('**');
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-slate-900">{part}</strong>
      : part
  );
}

export function safeText(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    try {
      return Object.entries(val as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join(' · ');
    } catch {
      return '';
    }
  }
  return String(val);
}

export function hasAccountingCode(text: string | null | undefined, code: string): boolean {
  if (!text) return false;
  const regex = new RegExp(`\\b${code}\\b`, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + code.length;
    
    let isPartOfPrice = false;
    if (start > 1) {
      const prevChar = text[start - 1];
      const prevPrevChar = text[start - 2];
      if ((prevChar === '.' || prevChar === ',') && /\d/.test(prevPrevChar)) {
        isPartOfPrice = true;
      }
    }
    if (end < text.length - 1) {
      const nextChar = text[end];
      const nextNextChar = text[end + 1];
      if ((nextChar === '.' || nextChar === ',') && /\d/.test(nextNextChar)) {
        isPartOfPrice = true;
      }
    }
    
    if (!isPartOfPrice) {
      return true;
    }
  }
  return false;
}

export function formatHistoryTitle(val: string): string {
  if (!val) return '';
  let result = val.toLowerCase().split(' ').map((word, index) => {
    if (!word) return '';
    const lowercaseMatches = ['de', 'la', 'el', 'los', 'las', 'en', 'y', 'o', 'con', 'del'];
    if (lowercaseMatches.includes(word) && index !== 0) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  result = result.replace(/\s*-\s*/g, ' — ');
  result = result.replace(/\bFf\b/g, 'FF');
  result = result.replace(/\bId\b/g, 'ID');
  result = result.replace(/\bEpe\b/g, 'EPE');
  result = result.replace(/\bN°\b/gi, 'N°');
  return result;
}
