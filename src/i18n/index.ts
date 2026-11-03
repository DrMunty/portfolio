import { en, es, type MessageKey } from './messages';

// The language of the page. English is always the default; `?lang=es` selects Spanish (handy for a link in the Spanish CV) and the
// choice made with the switch is remembered. The state is plain data, so the logic that writes text
// stays testable without a page.
export type Lang = 'en' | 'es';

const dictionaries: Record<Lang, Record<MessageKey, string>> = { en, es };
const listeners = new Set<() => void>();
let current: Lang = 'en';

export const getLang = (): Lang => current;

export function t(key: MessageKey, values: Record<string, string | number> = {}): string {
  const text = dictionaries[current][key] ?? en[key];
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

export function onLangChange(listener: () => void): void {
  listeners.add(listener);
}

export function setLang(lang: Lang, remember = true): void {
  if (lang === current) return;
  current = lang;
  if (remember) {
    try {
      localStorage.setItem('lang', lang);
    } catch {
      // Private mode or blocked storage: the choice just is not remembered.
    }
  }
  listeners.forEach((listener) => listener());
}

const asLang = (value: string | null | undefined): Lang | null => (value === 'es' || value === 'en' ? value : null);

export function detectLang(search: string, stored: string | null): Lang {
  const fromUrl = asLang(new URLSearchParams(search).get('lang'));
  if (fromUrl) return fromUrl;
  return asLang(stored) ?? 'en';
}

export function initLang(): void {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('lang');
  } catch {
    stored = null;
  }
  current = detectLang(location.search, stored);
}
