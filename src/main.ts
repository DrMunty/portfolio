import '@fontsource-variable/archivo';
import './style.css';

import arrowUpRight from '@phosphor-icons/core/assets/regular/arrow-up-right.svg?raw';
import check from '@phosphor-icons/core/assets/regular/check.svg?raw';
import copy from '@phosphor-icons/core/assets/regular/copy.svg?raw';
import githubLogo from '@phosphor-icons/core/assets/regular/github-logo.svg?raw';
import linkedinLogo from '@phosphor-icons/core/assets/regular/linkedin-logo.svg?raw';

import { wireAssistant } from './ui/assistant';
import { startField } from './ui/field';
import { chapters, intro } from './ui/motion';
import { wireWorkIndex } from './ui/work-index';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const field = document.querySelector<HTMLCanvasElement>('[data-field]')!;

const icons: Record<string, string> = {
  'arrow-up-right': arrowUpRight,
  copy,
  'github-logo': githubLogo,
  'linkedin-logo': linkedinLogo,
};
document.querySelectorAll<HTMLElement>('i[data-icon]').forEach((el) => {
  el.innerHTML = icons[el.dataset.icon ?? ''] ?? '';
  el.setAttribute('aria-hidden', 'true');
});

wireAssistant(document.querySelector<HTMLElement>('[data-assistant]')!, !reduceMotion);
const background = startField(field, [...document.querySelectorAll('[data-zone]')], reduceMotion);
wireWorkIndex(
  [...document.querySelectorAll<HTMLAnchorElement>('.work__list a')],
  document.querySelector<HTMLElement>('[data-preview]')!,
  (index) => background.setTint(index),
);

// Copy the email address; the label confirms it.
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.querySelector('span')!;
  const icon = btn.querySelector('i')!;
  let timer: number | undefined;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy ?? '');
      label.textContent = 'Copied';
      icon.innerHTML = check;
    } catch {
      label.textContent = 'Select and copy it above';
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      label.textContent = 'Copy email';
      icon.innerHTML = copy;
    }, 2200);
  });
});

if (reduceMotion) {
  document.documentElement.classList.remove('motion');
} else {
  intro(field);
  chapters();
}
