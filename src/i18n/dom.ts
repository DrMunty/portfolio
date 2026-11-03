import { getLang, onLangChange, setLang, t, type Lang } from './index';
import type { MessageKey } from './messages';

// Writes the current language into the page: text of [data-i18n], markup of [data-i18n-html] and attributes of
// [data-i18n-attr="alt:key;aria-label:key"], plus <html lang>, the title and the description.
// Things that wrap text (the split headline) register here to hand the plain text back before it is rewritten.
export const beforeApply: Array<() => void> = [];

export function applyLanguage(): void {
  beforeApply.forEach((undo) => undo());
  document.documentElement.lang = getLang();
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as MessageKey);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml as MessageKey);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    for (const pair of (el.dataset.i18nAttr ?? '').split(';')) {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr, t(key as MessageKey));
    }
  });
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === getLang()));
  });
}

export function wireLanguageSwitch(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => setLang(button.dataset.lang as Lang));
  });
  onLangChange(applyLanguage);
  applyLanguage();
}
