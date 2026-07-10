const PROTOTYPE_POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function safeJSONParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString || typeof jsonString !== 'string') return fallback;
  try {
    const parsed = JSON.parse(jsonString, (key, value) => {
      if (key !== '' && PROTOTYPE_POISON_KEYS.has(key)) return undefined;
      return value;
    });
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function sanitizeFileName(fileName?: string | null): string {
  if (!fileName || typeof fileName !== 'string') return 'chess-position';
  let s = fileName.replace(/[\\/:*?"<>|&]/g, '-');
  s = s.replace(/\s+/g, '_');
  s = s.replace(/^\.+/, '').replace(/\.+$/, '').trim();
  if (s.length > 100) s = s.substring(0, 100);
  return s || 'chess-position';
}

export function isValidHexColor(color: unknown): color is string {
  if (!color || typeof color !== 'string') return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function sanitizeHexColor(color: unknown, fallback = '#ffffff'): string {
  return isValidHexColor(color) ? color : fallback;
}

export function sanitizeInput(input: unknown, maxLength = 500): string {
  if (!input || typeof input !== 'string') return '';
  let s = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  s = s.trim();
  return s.length > maxLength ? s.substring(0, maxLength) : s;
}

export function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
